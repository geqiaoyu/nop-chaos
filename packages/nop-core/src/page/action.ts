/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isArray, isPlainObject, isPromise, isString } from "@vue/shared";
import { v4 as uuid } from "uuid";
import { importModule } from "../core";
import { getApi } from "../api/registry";
import { ajaxFetch, ajaxRequest } from '../core/ajax';
import { absolutePath } from "../shared";
import { processXuiDirective, processXuiValue } from "./processor";

import { useAdapter } from "../adapter";

type FnScope = {
  standalone: boolean,
  libs: Record<string, object>
}

/**
 * 通过xui:import可以引入SystemJs格式的js模块，通过@fn:xxx这种形式可以调用js模块中的函数
 * 
 * 例如 {
 *    "xui:import": "a.lib"
 *    "page": {
 *       dialog: {
 *          "xui:import": "b.lib"
 *          api: "@fn:a.f1"
 *       }
 *    }
 * }
 * 
 * 上面的例子中@fn:a.f1首先向上查找最近的xui:import引入的js库，如果没有找到，则继续向上查找直到顶层的节点。
 * 
 * @param json json schema
 */
export async function bindActions(pageUrl: string, json: any, page: any) {
  if (!json) return;

  const promises: Promise<any>[] = []
  const fnStack: FnScope[] = []

  // 收集所有的xui:import，异步加载脚本库
  processXuiDirective(json, "xui:import", (modulePaths, obj, processProps) => {
    // standalone表示不会向上查找action
    const standalone = obj['xui:standalone']
    const fnScope = { standalone, libs: {} }
    fnStack.push(fnScope)
    fetchModules(pageUrl, modulePaths, promises, fnScope)
    processProps(obj)
    return obj
  })

  // 等待所有脚本库加载完毕
  await Promise.all(promises)

  let stackIndex = 0;

  function process(json: any) {
    let modulePaths = json['xui:import']
    if (modulePaths) {
      stackIndex++
    }

    for (let key in json) {
      const v = json[key]
      if (!v)
        continue

      if (isString(v)) {
        json[key] = processValue(v)
      } else if (isArray(v)) {
        for (let i = 0, n = v.length; i < n; i++) {
          process(v[i])
        }
      } else {
        process(v)
      }
    }

    if (modulePaths) {
      stackIndex--
    }
  }

  function processValue(v: string) {
    if (v.startsWith("@query:")) {
      // amis的新版本要求url必须满足URL格式，必须是schema://path形式
      return "query://" + v.substring("@query:".length)
    } else if (v.startsWith("@mutation:")) {
      return "mutation://" + v.substring("@mutation:".length)
    } else if (v.startsWith("@graphql:")) {
      return "graphql://" + v.substring("@graphql:".length)
    } else if (v.startsWith("@dict:")) {
      return "dict://" + v.substring("@dict:".length)
    } else if (v.startsWith("@page:")) {
      return "page://" + v.substring("@page:".length)
    } else if (v.startsWith("@action:")) {
      const handler = findAction(v.substring("@action:".length).trim(), fnStack, stackIndex)
      return wrapFunc(handler, v, page)
    } else if (v.startsWith("@fn:")) {
      const fn = buildFunction(v.substring("@fn:".length))
      return wrapFunc(fn, v, page)
    }
    return v
  }

  process(json)
}

function buildFunction(fn: string) {
  return useAdapter().compileFunction(fn)
}

function fetchModules(pageUrl: string, modulePaths: any, promises: Promise<any>[], fnScope: FnScope) {

  if (isString(modulePaths)) {
    modulePaths = modulePaths.split(',').reduce((m, p) => { m[getPathName(p)] = p; return m }, {} as Record<string, string>)
  }

  for (const moduleName in modulePaths) {
    const path = absolutePath(modulePaths[moduleName], pageUrl)
    const promise = importModule(path).then((mod: any) => {
      fnScope[moduleName] = mod
    })
    promises.push(promise)
  }
}

function getPathName(path: string) {
  let pos = path.lastIndexOf('/');
  if (pos >= 0)
    path = path.substring(pos + 1)
  let pos2 = path.indexOf('.')
  if (pos2 > 0)
    return path.substring(0, pos2)
  return path
}

function findAction(fnName: string, fnStack: FnScope[], stackIndex: number) {
  const pos = fnName.indexOf('.')
  if (pos < 0) {
    const api = getApi(fnName)
    if (!api)
      throw new Error("nop.err.unknown-fn:fnName=" + fnName)
    return api
  }

  const libName = fnName.substring(0, pos)
  const methodName = fnName.substring(pos + 1)

  for (let i = stackIndex; i >= 0; i--) {
    let fnScope = fnStack[i]

    if (fnScope.standalone)
      break

    const lib = fnScope.libs[libName]
    if (lib && lib[methodName]) {
      return lib[methodName]
    }
  }
  throw new Error("nop.err.unknown-fn:fnName=" + fnName)
}

/**
 * 将函数的JSON序列化结果固化为指定值
 */
function wrapFunc(fn: Function, text: string, page: any) {
  const ret = (...args) => fn(page, ...args)
  ret.toJSON = () => text
  return ret
}