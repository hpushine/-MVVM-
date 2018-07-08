class Compile{
	constructor(el, vm) {
		this.el = this.isElementNode(el) ? el : document.querySelector(el);
		this.vm = vm;
		document.querySelector(el);

		if(this.el) {
			//获取到元素才开始编译
			//1.将dom加载到内存，fragment
			let fragment = this.nodetoFragment(this.el);

			//2.编译 查出v-model {{}}
			this.compile(fragment);

			//fragment加入页面
			this.el.appendChild(fragment)
		}

	}

	

	//辅助方法
	isElementNode(node) {
		return node.nodeType === 1;
	}


	//核心方法
	compile(fragment) {
		let childNodes = fragment.childNodes;
		
		Array.from(childNodes).forEach(node=>{
			if(this.isElementNode(node)) {
				//是元素节点，递归
				this.compile(node);
				this.compileElement(node);
				console.log('element:',node)
			} else{
				this.compileText(node);
				console.log('test:' +node)
			}
		})
	}
	//编译元素
	compileElement(node) {
		let attrs = node.attributes;
		Array.from(attrs).forEach(attr=>{
			console.log(attr.name)
			let attrName = attr.name;
			if(this.isDirective(attrName)) {
				//取到对应值放到节点
				let expr = attr.value;
				// let type = attrName.slice(2);
				let [,type] = attrName.split('-');
				//node this.vm.$data expr
				CompileUtil[type](node, this.vm, expr)

			}
		})

	}

	compileText(node) {
		let expr = node.textContent; //取文本内容
		let reg = /\{\{([^}]+)\}\}/g;
		if(reg.test(expr)) {
			//this.vm.$data text
			CompileUtil['text'](node, this.vm, expr)
		}
	}
	//判断是否指令
	isDirective(name) {
		return name.includes('v-');
	}

	nodetoFragment(el) {
		let fragment = document.createDocumentFragment();
		let firstChild;
		while (firstChild = el.firstChild){
			fragment.appendChild(firstChild);
		}

		return fragment; //内存中节点
	}

}

CompileUtil = {
	getVal(vm,expr) {//获取实例上对应数据
		expr = expr.split('.'); // [a,b,c]
		return expr.reduce((prev,next)=>{ //vm.$data.a
			return prev[next];
		},vm.$data);
	},

	getTextVal(vm,expr) {
		return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
			return this.getVal(vm,arguments[1]);
			// return arguments[1];
		});
	},
	text(node,vm,expr) {
		let updateFn = this.updater['textUpdate'];
		// console.log(expr)
		let value = this.getTextVal(vm,expr);
		/*let value = expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
			return this.getVal(vm,arguments[1]);
			return arguments[1];
		});*/

		//加入watch后添加
		expr.replace(/\{\{([^}]+)\}\}/g, (...arguments)=>{
			// return arguments[1];
			new Watcher(vm,arguments[1],()=>{
				//文本节点数据变化，重新获取依赖属性更新文本内容
				updateFn && updateFn(node,this.getTextVal(vm,expr));
			});
		});
		// new Watcher(vm,expr);


		updateFn && updateFn(node,value);
	},

	setVal(vm,expr,value) {
		expr = expr.split('.'); // [a,b,c]
		return expr.reduce((prev,next,currentIndet)=>{ //vm.$data.a
			
			if(currentIndet == expr.length -1) {
				return prev[next] = value;
			}
			return prev[next]; //获取值

		},vm.$data);
	},
	model(node,vm,expr) {
		let updateFn = this.updater['modelUpdate'];

		//这里加一个监控 数据变化 调用watch的callback
		new Watcher(vm,expr,(newVal)=>{
			//值变化调用cb 新值传入 调用watch里updata时调用
			updateFn && updateFn(node,newVal);
		});

		//数据输入框绑定
		node.addEventListener('input',(e)=>{
			let newVal = e.target.value;
			this.setVal(vm,expr,newVal);
		})

		updateFn && updateFn(node,this.getVal(vm,expr));
	},

	updater:{
		textUpdate(node, value) {
			node.textContent = value;
		},
		modelUpdate(node, value) {
			node.value = value;
		}
	}
}

