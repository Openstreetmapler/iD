iD.ui.intro = function(context) {
    var step;

    function intro(selection) {

        function localizedName(id) {
            var features = {
                n2140018997: 'city_hall',
                n367813436: 'fire_department',
                w203988286: 'memory_isle_park',
                w203972937: 'riverwalk_trail',
                w203972938: 'riverwalk_trail',
                w203972940: 'riverwalk_trail',
                w41785752: 'w_michigan_ave',
                w134150789: 'w_michigan_ave',
                w134150795: 'w_michigan_ave',
                w134150800: 'w_michigan_ave',
                w134150811: 'w_michigan_ave',
                w134150802: 'e_michigan_ave',
                w134150836: 'e_michigan_ave',
                w41074896: 'e_michigan_ave',
                w17965834: 'spring_st',
                w203986457: 'scidmore_park',
                w203049587: 'petting_zoo',
                w17967397: 'n_andrews_st',
                w17967315: 's_andrews_st',
                w17967326: 'n_constantine_st',
                w17966400: 's_constantine_st',
                w170848823: 'rocky_river',
                w170848824: 'rocky_river',
                w170848331: 'rocky_river',
                w17967752: 'railroad_dr',
                w17965998: 'conrail_rr',
                w134150845: 'conrail_rr',
                w170989131: 'st_joseph_river',
                w143497377: 'n_main_st',
                w134150801: 's_main_st',
                w134150830: 's_main_st',
                w17966462: 's_main_st',
                w17967734: 'water_st',
                w17964996: 'foster_st',
                w170848330: 'portage_river',
                w17965351: 'flower_st',
                w17965502: 'elm_st',
                w17965402: 'walnut_st',
                w17964793: 'morris_ave',
                w17967444: 'east_st',
                w17966984: 'portage_ave'
            };
            return features[id] && t('intro.graph.' + features[id]);
        }

        context.enter(iD.modes.Browse(context));

        // Save current map state
        var history = context.history().toJSON(),
            hash = window.location.hash,
            center = context.map().center(),
            zoom = context.map().zoom(),
            background = context.background().baseLayerSource(),
            opacity = d3.select('.background-layer').style('opacity'),
            loadedTiles = context.connection().loadedTiles(),
            baseEntities = context.history().graph().base().entities,
            introGraph, name;

        // Block saving
        context.inIntro(true);

        // Load semi-real data used in intro
        context.connection().toggle(false).flush();
        context.history().reset();

        introGraph = JSON.parse(iD.introGraph);
        for (var key in introGraph) {
            introGraph[key] = iD.Entity(introGraph[key]);
            name = localizedName(key);
            if (name) {
                introGraph[key].tags.name = name;
            }
        }
        context.history().merge(d3.values(iD.Graph().load(introGraph).entities));
        context.background().bing();

        d3.select('.background-layer').style('opacity', 1);

        var curtain = d3.curtain();
        selection.call(curtain);

        function reveal(box, text, options) {
            options = options || {};
            if (text) curtain.reveal(box, text, options.tooltipClass, options.duration);
            else curtain.reveal(box, '', '', options.duration);
        }

        var steps = ['navigation', 'point', 'area', 'line', 'startEditing'].map(function(step, i) {
            var s = iD.ui.intro[step](context, reveal)
                .on('done', function() {
                    entered.filter(function(d) {
                        return d.title === s.title;
                    }).classed('finished', true);
                    enter(steps[i + 1]);
                });
            return s;
        });

        steps[steps.length - 1].on('startEditing', function() {
            curtain.remove();
            navwrap.remove();
            d3.select('.background-layer').style('opacity', opacity);
            context.connection().toggle(true).flush().loadedTiles(loadedTiles);
            context.history().reset().merge(d3.values(baseEntities));
            context.background().baseLayerSource(background);
            if (history) context.history().fromJSON(history, false);
            context.map().centerZoom(center, zoom);
            window.location.replace(hash);
            context.inIntro(false);
        });

        var navwrap = selection.append('div').attr('class', 'intro-nav-wrap fillD');

        var buttonwrap = navwrap.append('div')
            .attr('class', 'joined')
            .selectAll('button.step');

        var entered = buttonwrap
            .data(steps)
            .enter()
            .append('button')
            .attr('class', 'step')
            .on('click', enter);

        entered
            .call(iD.svg.Icon('#icon-apply', 'pre-text'));

        entered
            .append('label')
            .text(function(d) { return t(d.title); });

        enter(steps[0]);

        function enter (newStep) {
            if (step) { step.exit(); }

            context.enter(iD.modes.Browse(context));

            step = newStep;
            step.enter();

            entered.classed('active', function(d) {
                return d.title === step.title;
            });
        }

    }
    return intro;
};

iD.ui.intro.pointBox = function(point, context) {
    var rect = context.surfaceRect();
    point = context.projection(point);
    return {
        left: point[0] + rect.left - 30,
        top: point[1] + rect.top - 50,
        width: 60,
        height: 70
    };
};

iD.ui.intro.pad = function(box, padding, context) {
    if (box instanceof Array) {
        var rect = context.surfaceRect();
        box = context.projection(box);
        box = {
            left: box[0] + rect.left,
            top: box[1] + rect.top
        };
    }
    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
};

iD.ui.intro.icon = function(name, svgklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
        '<use xlink:href="' + name + '"></use></svg>';
};
