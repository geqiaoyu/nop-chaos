import {
  ListenerAction,
  ListenerContext,
  registerAction,
  RendererAction
} from 'amis-core';
import {RendererEvent} from 'amis-core';

// 动作定义
interface IPageAction extends ListenerAction {
  actionType: 'page-action';
  actionName: string;
  args: Record<string,any>;
}

/**
 * 我的动作实现
 */
export class AmisPageAction implements RendererAction {
  run(action: ListenerAction, renderer: ListenerContext, event: RendererEvent<any>, mergeData?: any) {
    const env = renderer.props.env;
    const page = (env as any)._page;
    let actionName = action.actionName;
    if (actionName.startsWith("action://"))
      actionName = actionName.substring("action://".length);

    const actionFn = page.getAction(actionName);
    if (!actionFn)
      return Promise.reject(`unknown action:${action.actionName}`);

    return Promise.resolve(actionFn(action.args, page, { action, renderer, event, mergeData}));
  }
}

// 注册自定义动作
registerAction('page-action', new AmisPageAction());