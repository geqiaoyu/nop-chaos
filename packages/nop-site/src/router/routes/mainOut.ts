/**
The routing of this file will not show the layout.
It is an independent new page.
the contents of the file still need to log in to access
 */
import type { AppRouteModule } from '/@/router/types';


// test
// http:ip:port/main-out
export const mainOutRoutes: AppRouteModule[] = [
  {
    path: '/amis/:path(.*\.page\.yaml)',
    name: 'default-page',
    component: () => import('/@/nop/amis/AmisPage.vue'),
    meta: {
      title: 'Page',
      hideMenu: true,
      hideBreadcrumb: true,
    },

    props: (route) => ({ path: '/' + route.params.path })
  },
  {
    path: '/test1',
    name: 'test1',
    component: () => import('../../nop/amis/AmisTest'),
    meta: {
      title: 'Test',
      hideMenu: true,
      hideBreadcrumb: true
    }
  }
  // {
  //   path: '/main-out',
  //   name: 'MainOut',
  //   component: () => import('/@/views/demo/main-out/index.vue'),
  //   meta: {
  //     title: 'MainOut',
  //     ignoreAuth: true,
  //   },
  // },
];

export const mainOutRouteNames = mainOutRoutes.map((item) => item.name);
