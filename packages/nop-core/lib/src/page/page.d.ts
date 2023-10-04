import { BasePage, FetcherRequest, FetcherResult } from '../core';
import { AdapterType } from "../adapter";
/**
 * scoped对应当前amis的scope。只有page/crud/service/form/等少数组件才具有scope
 */
export type PageAction = (page: PageObject, scoped: any, options: FetcherRequest) => Promise<FetcherResult>;
export type OnOkCallback = (value?: any) => Promise<boolean | void> | boolean | void;
export type OnCancelCallback = () => void;
export type OnChangeCallback = (value: any) => void;
export type RegisterPage = (page: PageObject) => void;
/**
 * 在action函数中可以访问到的页面对象，包括router, amis的store和pinia store等
 */
export type PageObject = BasePage & {
    id: string;
    path?: string;
    adapter: AdapterType;
    ajaxRequest: (req: FetcherRequest) => Promise<any>;
    ajaxFetch: (req: FetcherRequest) => Promise<FetcherResult>;
    require: (path: string) => Promise<any>;
    /**
     * 获取amis的component
     */
    getComponent(name: string): any;
    getComponentStore(name: string): any;
    getState(name: string, value: any): any;
    setState(name: string, value: any): any;
};
export type PageOptions = {
    /**
     * 获取amis的component
     */
    getComponent(name: string): any;
    getComponentStore(name: string): any;
    getState(name: string, value: any): any;
    setState(name: string, value: any): any;
    actions?: Record<string, Function>;
};
export declare function createPage(options: PageOptions): PageObject;
