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
import { alert, confirm, toast } from 'amis';
import copy from 'copy-to-clipboard';
import { useDebug, default_jumpTo, isCancel, useAdapter, default_isCurrentUrl, ajaxFetch, default_updateLocation, providePage } from "@nop-chaos/nop-core";
export function createEnv(page) {
    const { debug } = useDebug();
    const adapter = useAdapter();
    let env = {
        session: page.id,
        affixOffsetTop: 0,
        fetcher(options) {
            providePage(page);
            options._page = page;
            return ajaxFetch(options);
        },
        jumpTo(to, action, ctx) {
            const router = adapter.useRouter();
            return default_jumpTo(router, to);
        },
        isCancel: isCancel,
        isCurrentUrl: default_isCurrentUrl,
        updateLocation(to, replace) {
            // 调用go将会导致页面组件重新加载
            //const go = useGo(page.router)
            //go(normalizeLink(to), replace)
            default_updateLocation(to, !!replace);
        },
        notify: (type, msg, conf) => {
            if (msg.startsWith("_"))
                return;
            conf = Object.assign({ closeButton: true }, conf);
            toast[type] ?
                toast[type](msg, conf)
                : console.warn("[notify]", type, msg);
            // toast[type]
            //   ? toast[type](
            //     msg,
            //     conf
            //   )
            //   : console.warn("[notify]", type, msg);
            console.log("[notify]", type, msg);
        },
        enableAMISDebug: debug.value,
        alert,
        confirm,
        copy: (contents, options) => {
            if (options === void 0) {
                options = {};
            }
            const { t } = adapter.useI18n();
            const ret = copy(contents, options);
            ret &&
                (!options || options.shutup !== true) &&
                toast.info(t("Copy To Clipboard"));
            return ret;
        }
    };
    env._page = page;
    page.env = env;
    return env;
}