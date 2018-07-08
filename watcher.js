// 给需要变化的元素（input）增加观察者，数据变化后执行对应方法
class Watcher{
	constructor(vm, expr, fn) {
		this.vm = vm;
		this.expr = expr;
		this.cb = fn;
		//获取旧值
		this.oldvalue = this.getOld();		
	}

	getVal(vm,expr) {//获取实例上对应数据
		expr = expr.split('.'); // [a,b,c]
		return expr.reduce((prev,next)=>{ //vm.$data.a
			return prev[next];
		},vm.$data);
	}

	getOld() {
		Dep.target = this;

		let oldVal = this.getVal(this.vm,this.expr);

		Dep.target = null;

		return oldVal;
	}
	//对外暴露方法
	update() {
		let newVal = this.getVal(this.vm,this.expr);
		let oldVal = this.oldvalue;
		if(newVal != oldVal) {
			this.cb(newVal) //调用watch的callback
		} 
	}

//比对新值和旧值，发生变化则执行更新方法
	
	
}