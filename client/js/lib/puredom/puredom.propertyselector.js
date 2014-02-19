/** Adds property selectors to puredom.
 *	@example
 *		puredom("input[type=checkbox]:checked")
 */
(function(factory) {
	if (typeof window.define==='function' && window.define.amd) {
		window.define(['puredom'], factory);
	}
	else {
		factory(window.puredom);
	}
}(function(puredom) {
	/** @exports exports as puredom.propertyselector */
	var exports = {
		VERSION : '0.1.0'
	};
	
	// speedhack
	var sel = puredom('body');
	sel._nodes = [];
	
	puredom.selectorEngine.addSelectorFilter(
		/^\:([^#.:\[<>\{+\|\s]+)/gi,
		function(matches, nodes, config) {
			var i, val, node, prop=matches[1];
			for (i=nodes.length; i--; ) {
				node = nodes[i];
				if (prop==='selected') {
					val = node===document.activeElement;
				}
				else if (prop==='animated') {
					// speedhack
					sel._nodes[0] = node;
					val = sel.hasClass('_puredom_animating');
				}
				else if (prop==='visible' || prop==='hidden') {
					val = (node.offsetWidth || node.offsetHeight)>0 === (prop==='visible');
				}
				else {
					val = node[prop];
				}
				if (!val) {
					nodes.splice(i, 1);
				}
			}
		}
	);
	
	return exports;
}));