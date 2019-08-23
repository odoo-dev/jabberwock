// Load an editor with no default option
new EditorCore();
  
new EditorMassMailing();

  
// File: EditorMassMailing.js
import Editor from 'Editor.js';
import MassMailing from 'Odoo.js';
var editor = new Editor();
editor.addPlugin(MassMailing);

// Load an editor with all default options
new Editor();

// Load an editor with customized default options
var editor = new Editor({
  ui: {
    theme: 'Disco',
    toolbars: {
      floating: ['MagicWand', 'FontStyle', 'FontSize'],
      bottom: ['TextColor']
    }
  },
  pluginOptions: {
    Indent: {
      tabsize: 2
    }, 
  }
});
  

editor.configure({
  Indent: {
    tabSize: 2,
  }
});
  
import {Indent} from 'Indent.js';
editor.addPlugin(Indent, {
  tabSize: 2,
});

import {Formatting} from 'nby/Formatting.js';
editor.addPlugin(Formatting);
import {Formatting as OtherFormatting} from 'age/Formatting.js';
editor.addPlugin(OtherFormatting);

import CustomPlugin from 'CustomPlugin.js';
editor.addPlugin(CustomPlugin, {
	usefulOption: 2
});

// File: CustomPlugin.js
import Plugin from 'Plugin.js';
class CustomPlugin extends Plugin {
  constructor (option) {};
  publicFunction () {
		_privateFunction();    
  },
  _privateFunction () {
    _veryPrivateFunction.bind(this)();
  }
}
_veryPrivateFunction () {};
export {
  CustomPlugin
}
// File: CustomPluginGenerator.js
export function CustomPluginGenerator(pluginName) {
  return {
    init: function () {
      console.log("plugin ", pluginName, " started");
    },
  	keymap: {
    	'ctrl+c': 'whatever.' + commandName,
    }
  }
}
// File: ColorPicker.js
 export function ColorPicker(options) {
  return {
    init: function () {
      console.log("colorpicker started");
      return()
    },
    start: function () {
      console.log('start colorpicker');
    },
    commands: {
      commandName: function1,
      commandName2: function2,
    },
  	keymap: {
     	'CTRL+B': 'commandName',
    	'CTRL+C': 'commandName2',
    }
  }
}
   
// File: Extend.js
 export function extend (spec) {
   return spec.reduce((plugin, [pluginConstructor, pluginOptions]) => {
     return Object.assign(plugin, pluginConstructor(pluginOptions))
   }, {})
 }
// File: ColorPickerBaloon.js
 import { extend } from 'Extend.js';
 import { ColorPicker } from 'ColorPicker.js';
 import { OtherPlugin } from 'OtherPlugin.js';
 export function ColorPickerBaloonComp(options) {
  colorPickerOptions = {...options};
  otherPluginOptions = {...options};
  const colorPicker = ColorPicker(colorPickerOptions),
  return Object.assign{
		OtherPlugin(otherPluginOptions),
    start: function () {
      colorPicker.start();
      console.log('balloon started');
    },
  	keymap: {...colorPicker.keymap,
      'ctrl+c': 'awesome.colorpicker2',
      'ctrl+d': 'awesome.colorpicker2D',
  }
}
    
// File: ColorPickerBaloon.js
 import { extend } from 'Extend.js';
 import { ColorPicker } from 'ColorPicker.js';
 import { OtherPlugin } from 'OtherPlugin.js';
 export function ColorPickerBaloon(options) {
  colorPickerOptions = {...options};
  otherPluginOptions = {...options};
  return Plugin({
    extends(ColorPicker, colorPickerOptions),
		extends(OtherPlugin, otherPluginOptions),
    start: function (self) {
      self.super.start();
      console.log('balloon started');
    },
  	keymap: {...colorPicker.keymap,
      'ctrl+c': 'awesome.colorpicker2',
      'ctrl+d': 'awesome.colorpicker2D',
  })
}
 
   
   // File: ColorPickerBaloonNico.js
 import { extend } from 'Extend.js';
 import { ColorPicker } from 'ColorPicker.js';
 import { OtherPlugin } from 'OtherPlugin.js';

 function exec (stack, obj, method, inherithed) => {
    stack[-1][method]({
      ...obj,
      super: ()=>{
        exec(stack[::-2], method, obj)
      },
    });
  };
 function xtends(constructors: []) {
      return (options) => {
      
        const compo = constructors.map(constructor=>constructor(options))
      
        const newObj = {};
      	Object.keys(c).forEach(key=>newObj[key] = () => exec(compo, c, key))

    	  return newObj;
    };
  }
 
export let ColorPickerBaloon = extends(ColorPicker, OtherPlugin, (options) => {
  const yapOptions = {...options};
 	const composedPlugin = YetAnotherPlugin(yapOptions);
	return {
    init: function(self, params) {
      self.super.init(params);
      const yapParams = {...params};
      composedPlugin.init(yapParams);
    }
		start: function (self) {
      self.super.start();
      console.log('balloon started');
    },
  	keymap: {...colorPicker.keymap,
      'ctrl+c': 'awesome.colorpicker2',
      'ctrl+d': 'awesome.colorpicker2D',
  }))
}
    
//export function ColorPickerBaloon(options) {
export let ColorPickerBaloon = xtend(ColorPicker, OtherPlugin, { 
		start: function (self) {
      self.super.start();
      console.log('balloon started');
    },
  	keymap: {...colorPicker.keymap,
      'ctrl+c': 'awesome.colorpicker2',
      'ctrl+d': 'awesome.colorpicker2D',
  }))
}
c = ColorPickerBaloon({options})

DOC
ColorPicker options:
    color: 1=blue
    			 2=red

OtherPlugin options:
    color: 1=green
    			 2=purple

ColorPickerBaloon options:
    color: 1=blue&purple
    			 2=red&green

c = ColorPickerBalloon({color: 2})
   
 // File: Plugin.js
 export function Plugin(spec) {
   const superPlugin = spec.extend.reduce((plugin, [pluginConstructor, pluginOptions]) => {
	     return Object.assign(plugin, pluginConstructor(pluginOptions))
   }, {});
   return Object.assign(superPlugin, spec);
	
}
 // File: ColorPickerBaloon.js
 import { Plugin } from 'Plugin.js';
 import { ColorPicker } from 'ColorPicker.js';
 import { OtherPlugin } from 'OtherPlugin.js';
 export function ColorPickerBaloon(options) {
  colorPickerOptions = {...options};
  otherPluginOptions = {...options};
  return Plugin({
    extend: () => [
    	[ColorPicker, colorPickerOptions],
      [OtherPlugin, otherPluginOptions],
    ],
    start: () => {
      colorPicker.start();
      console.log('balloon started');
    },
  	keymap: {...colorPicker.keymap,
      'ctrl+c': 'awesome.colorpicker2',
      'ctrl+d': 'awesome.colorpicker2D',
  });
}

//file: LightEditor
//...
//file: Editor

import {Indent,IndentInterface} from 'Indent'
class Editor {
interface options {
	pluginOptions: {
  	Indent: IndentInterace
    Autre: AutreInterace
  }
}
  
init(options) {
	const editor = new LightEditor()
	editor.addPlugin(Indent(options.pluginOptions.Indent)))
  editor.addPlugin(Autre(options.pluginOptions.Autre)))
}
}
  

// default options
var options = {
  features: ['MagicWand', 'FontStyle', 'FontSize', 'TextColor', 'AwesomeTable'],
  ui: {
    theme: 'TheLionKing',
    toolbars: {
      top: ['MagicWand', 'FontStyle', 'FontSize', 'TextColor'],
      floating: ['MagicWand', 'FontStyle', 'FontSize', 'TextColor'],
      left: false,
      right: false,
      bottom: false,
    },
    shortcuts: [
      {
        shortcut: ['CTRL', 'B'],
        plugin: 'MagicWand',
        method: 'formatText',
        args: ['bold']
      }
    ]
  },
  pluginOptions: {
    MagicWand: {
      styles: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre']
    },
    FontStyle: {
      styles: ['bold', 'italic', 'underline']
    },
    FontSize: {
      defaultValue: 13,
      values: [8, 9, 10, 11, 12, 13, 14, 18, 24, 36, 48]
    },
  }
}
