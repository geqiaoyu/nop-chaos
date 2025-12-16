
import 'systemjs/dist/system.js'

declare var global:any

const System  = (typeof self !== 'undefined' ? self : global).System

const oldResolve = System.resolve;

// 规范化路径，消除 . 和 .. 片段
function normalizePath(path: string): string {
    const parts = path.split('/');
    const stack: string[] = [];
    for (const part of parts) {
        if (part === '' || part === '.') continue;
        if (part === '..') {
            if (stack.length > 0) stack.pop();
            continue;
        }
        stack.push(part);
    }
    const prefix = path.startsWith('/') ? '/' : '';
    return prefix + stack.join('/');
}

function dirname(path: string): string {
    const idx = path.lastIndexOf('/');
    if (idx <= 0) return '/';
    return path.slice(0, idx);
}

function resolveRelative(basePath: string, relative: string): string {
    const baseDir = dirname(basePath);
    const combined = (baseDir.endsWith('/') ? baseDir + relative : baseDir + '/' + relative);
    return normalizePath(combined);
}

System.resolve = function (id: string, parentUrl?: string) {
    const providerPrefix = "/p/SystemJsProvider__getJs?path=";

    if (id.endsWith(".lib.js")) {
        // 绝对路径：/xx/yy.lib.js（排除 /p 和 /public）
        if (id.startsWith("/") && !id.startsWith("/p/") && !id.startsWith("/public/")) {
            return oldResolve.call(this, providerPrefix + encodeURIComponent(id), parentUrl);
        }

        // 相对路径：./xx.lib.js 或 ../xx.lib.js
        if ((id.startsWith("./") || id.startsWith("../")) && parentUrl) {
            const pos = parentUrl.indexOf(providerPrefix);
            if (pos >= 0) {
                // parentUrl 形如 /p/SystemJsProvider__getJs?path=<encodedPath>
                const encoded = parentUrl.substring(pos + providerPrefix.length);
                const basePath = decodeURIComponent(encoded);
                const newPath = resolveRelative(basePath, id);
                return oldResolve.call(this, providerPrefix + encodeURIComponent(newPath), parentUrl);
            }
        }
    }

    return oldResolve.call(this, id, parentUrl);
}

/**
 * 动态加载js文件
 * @param path js文件路径
 * @returns 
 */
export function importModule(path: string) {
    return System.import(/*@vite-ignore*/path)
}


export function deleteDynamicModules() {
    for (let module of System.entries()) {
        const moduleId = module[0]
        if (moduleId.endsWith(".lib.js"))
            System.delete(moduleId)
    }
}

export function registerModule(name:string, lib:any){
    let libPath = name
    if(name.startsWith("./")){
        libPath = System.resolve(name)
    }else if(name.startsWith("@nop/")){
        libPath = System.resolve("./nop/" + name.substring("@nop/".length) + ".js")
    }else{
        libPath = System.resolve('./nop/' + name+'.js')
        System.addImportMap({
            imports: {
                [name] : libPath
            }
        })
    }
    System.set(libPath,lib)
}

export function addSystemImportMap(imports: Record<string,string>){
    System.addImportMap({
        imports
    })
}