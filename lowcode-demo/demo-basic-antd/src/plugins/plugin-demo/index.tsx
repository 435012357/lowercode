import * as React from 'react';
import { IPublicModelPluginContext } from '@alilc/lowcode-types';

const  LowcodePluginPluginDemo = (ctx: IPublicModelPluginContext) => {
  return {
    exports() {
      return {
        data: 'plugin-demo',
        func: () =>{
          console.log('💦方法也一样')
        }
      }
    },
     // 插件的初始化函数，在引擎初始化之后会立刻调用
    init() {
      // 你可以拿到其他插件暴露的方法和属性
      // const { data, func } = ctx.plugins.pluginA;
      // func();

      // console.log(options.name);

      // 往引擎增加面板
      ctx.skeleton.add({
        area: 'leftArea',
        name: 'LowcodePluginPluginDemoPane',
        type: 'PanelDock',
        props: {
          description: 'Demo',
        },
        content: <div>这是一个 Demo 面板</div>,
      });

      ctx.logger.log('打个日志');
    },
  }
}

// 插件名，注册环境下唯一
LowcodePluginPluginDemo.pluginName = 'LowcodePluginPluginDemo';
LowcodePluginPluginDemo.meta = {
  dependencies: [],
  engines: {
    'lowcodeEngine': '^1.0.0'
  }
}


export default LowcodePluginPluginDemo;
