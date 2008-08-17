// 2008/8/17 0.3.11�ڍs
(function(){
	var json = getPref('postConfig');
	if(!/reblog:/.test(json))
		return;
	
	var configs = eval(json);
	items(configs).forEach(function([name, config]){
		var favor = models[name].favor;
		
		delete config.reblog;
		
		items(config).forEach(function([type, value]){
			// �ЂƂł�default�Ɏw�肳��Ă�����favorite��default�Ƃ���
			if(favor && value)
				config.favorite = 'default';
			
			config[type] = value? 'default' :
				(value === '')? 'disabled' : 'enabled';
		});
		
		// favorite�����ݒ�Ȃ�enabled�Ƃ���
		if(favor && !config.favorite)
			config.favorite = 'enabled';
	});
	
	setPref('postConfig', uneval(configs));
})()
