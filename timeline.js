/**
 * Created by hkx on 2017/7/4.
 */
;!(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return factory.apply(this);
        })
    }
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory.call(this);
    } else {
        this.Timeline = factory.call(this, document);
    }
}(typeof global === 'object' ? global : this, function (doc) {
    'use strict';
    var Timeline = function () {
        if (!(this instanceof Timeline)) {
            return new Timeline();
        }
        this.version = '1.0.0';
        this.github = 'http://github.com/SeuHkx/Timeline';
    };
    Timeline.fn = Timeline.prototype;
    var timeLine = Timeline.fn.init = function (options) {
        if (!(this instanceof timeLine)) {
            return new timeLine(options);
        }
        this.options = {
            renderTo: '',
            section: [],
            //axisType:average is effective
            precision: 'default'||'minute'||'day'||'second'||'month'||'hours',
            //precision is effective
            interval:0,
            // must interval > 0 && precision === 'hours'
            intervalCurrent:false,
            //axisType:average is effective
            slice:1,
            averageTicks:{
                show:false,
                height: 8,
                width: 1,
                bgColor: '#000'
            },
            slidersArea: {
                drag:true,
                show:true,
                position: 'center' || 'bottom',
                height: 6,
                bgColor: 'rgba(51, 55, 64, 0.5)'
            },
            slider: {
                show: true,
                text:true,
                name:''||[],
                template: '<div class="timeline-slide"><div class="slide-tips" t-slider="$location">{{value}}</div><div class="slide"></div></div>',
                location: ['2012-02', '2013'],
                width: 14
            },
            axisType: 'order' || 'average',
            //axisType:average is effective
            animation:true,
            axisStyle: {
                height:1,
                bgColor: 'transparent',
                bdSize :1,
                bdDirection:'top'||'right'||'bottom'||'left'||'all',
                bdColor: '#bfbfbf',
                bdStyle: 'solid',
                color: '#fff',
                radius:0
            },
            axisTicks: {
                show:true,
                width: 100,
                fontSize: 14,
                color: '#bfbfbf',
                animation:false
            },
            axisTicksLineStyle: {
                height: 28,
                width: 1,
                bgColor: '#bfbfbf'
            },
            axisItemWidth: 800,
            axisItemTicksStyle: {
                fontSize: 12,
                height: 16,
                width: 1,
                bgColor: '#cfcfcf',
                color: '#cfcfcf',
                unit:''||['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            }
        };
        Timeline.extends(this.options, options);
        this.axis = {
            renderTo: doc.getElementById(this.options.renderTo),
            element: null,
            sliders: null,
            slidersMirror:null,
            totalWidth: this._axisTemplateWidth(),
            slidersArea: null,
            slidersAreaCalculationWidth: 0,
            recordPoint: [],
            recordData: {},
            ticksId:null,
            axisItemTicksWidth:(this.options.axisItemWidth - this.options.axisTicks.width)/12,
            intervalDate:{
                year :0,
                month:0,
                day  :0,
                crossYear:false,
                crossMonth:false
            }
        };
        this.axis.sliderTarget = 1;
        this.dataTime = [];
        //interval
        if(this.options.interval > 0 && this.options.precision === 'hours'){
            this.options.section = this._axisPrecisionDaySection(this.options.section);
        }
        //this.axisRecord = this._axisRecord();
        if (this.options.axisType === 'order') {
            this.axis.element = Timeline.parseDom(this._axisTemplate(this.axis.totalWidth, true))[0];
            this._render();
        }
        if (this.options.axisType === 'average') {
            this._renderTypeAverage();
        }
        this.disabled = false;
        this.calculationGetDateSection = function(){
            var precision = this._initAxisPrecisionDaySection();
            var sections  = [];
            var sectionsDate = [];
            var starDate = precision.section[0];
            var endDate  = precision.section[1];
            if((endDate-starDate)>0){
                if((precision.intervalDate.day - starDate) >= 0){
                    for(;starDate <= endDate;){
                        sectionsDate.push(starDate);
                        starDate++;
                    }
                    sections = sections.concat(sectionsDate);
                }
                sections = this._precisionGetDaySectionAndHours(sections,precision);
                return sections;
            }
            if((endDate-starDate)<0){
                if((precision.intervalDate.day - starDate) >= 0){
                    for(;starDate <= precision.intervalDate.day;){
                        sectionsDate.push(starDate);
                        starDate++;
                    }
                    for(var i = 1; i <= endDate;i+=1){
                        sectionsDate.push(i);
                    }
                    sections = sections.concat(sectionsDate);
                }
                sections = this._precisionGetDaySectionAndHours(sections,precision);
                return sections;
            }
        };
        this.drag = function () {
        };
        this.end  = function () {
        };
        this.setOption = function (option) {
            if(this.options.axisType !== option.axisType && typeof option.axisType !== 'undefined'){
                console.warn('axisType type must be the same');
                return false;
            }
            try {
                this.axis.renderTo.removeChild(this.axis.element);
            } catch (e) {
                console.warn('renderTo is error or renderTo is null')
            }
            Timeline.extends(this.options, option);
            //interval
            if(this.options.interval > 0 && this.options.precision === 'hours'){
                this.options.section = this._axisPrecisionDaySection(this.options.section);
            }
            if (this.options.axisType === 'order') {
                this._renderTypeOrder();
            } else {
                this._renderTypeAverage();
            }
        };
    };
    var TimeLineMethods = {
        _renderTypeAverage: function () {
            var styles = {
                position: 'relative',
                width: '100%'
            };
            this._axisUpdateTypeAverageOptions();
            this._renderToStyle(styles);
            //slider
            this._slider();
        },
        _axisUpdateTypeAverageOptions: function () {
            var COVER_NUMBER = 1;
            var sectionArea  = '';
            if(this.options.interval > 0 && this.options.precision === 'hours'){
                sectionArea  = this.options.interval;
            }else{
                sectionArea  = ((this.options.section[this.options.section.length - 1] - this.options.section[0] + COVER_NUMBER)*this.options.slice);
            }
            try {
                var renderToWidth = parseInt(getComputedStyle(this.axis.renderTo)['width']);
            } catch (e) {
                console.warn('renderTo is error or renderTo is null')
            }
            this.dataTime = [];
            this.axis.recordPoint = [];
            this.axis.recordData  = {};
            this.axis.totalWidth = renderToWidth;
            this.axis.axisItemTicksWidth = this.options.axisTicks.width = this.options.axisItemWidth = renderToWidth / sectionArea;
            this.axis.element = Timeline.parseDom(this._axisTemplate(renderToWidth, false))[0];
            this.axisRecord = this._axisRecord();
        },
        _renderTypeOrder:function () {
            this.dataTime = [];
            this.axis.recordPoint = [];
            this.axis.recordData  = {};
            this.axis.totalWidth  = this._axisTemplateWidth();
            this.axis.element = Timeline.parseDom(this._axisTemplate(this.axis.totalWidth, true))[0];
            this.axis.axisItemTicksWidth = (this.options.axisItemWidth - this.options.axisTicks.width)/12;
            //this.axisRecord = this._axisRecord();
            this._render();
        },
        _render: function () {
            var styles = {
                position: 'relative',
                // overflow: 'hidden',
                width: '100%'
            };
            this._renderToStyle(styles);
            this.axisRecord = this._axisRecord();
            var visualArea = parseInt(getComputedStyle(this.axis.renderTo,null)['width']);
            var sliderPosition = this.axisRecord[this.options.slider.location[0]];
            if(visualArea < sliderPosition){
                this.axis.element.style.left = -(sliderPosition - visualArea/2) + 'px';
            }
            if (this.options.slider.show) this._slider();
            this._axisDragInit();
        },
        _axisDragInit:function () {
            Timeline.Drag(this.axis.element, {
                limit: function (moveX) {
                    var tolerance;
                    this.options.axisTicks.width < 100 ? tolerance = this.options.axisTicks.width / 2 : tolerance = 0;
                    var limitWidth = this.axis.element.offsetParent.offsetWidth - this.axis.element.offsetWidth;
                    moveX = moveX < limitWidth ? limitWidth : moveX;
                    moveX = moveX > 0 ? tolerance : moveX - tolerance;
                    return moveX;
                }.bind(this)
            });
        },
        _renderToStyle: function (styles) {
            try {
                for (var style in styles) {
                    this.axis.renderTo.style[style] = styles[style];
                }
                this.axis.renderTo.appendChild(this.axis.element);
                if(this.options.animation && this.options.axisType === 'average'){
                    var ticks = doc.getElementById(this.axis.ticksId).childNodes;
                    var positions = this._axisTicksPosition();
                    setTimeout(function () {
                        for(var i = 0 ; i < ticks.length; i += 1){
                            ticks[i]['style']['left'] = positions[i] + 'px';
                        }
                    },80);
                }
            } catch (e) {
                console.warn('renderTo is error or renderTo is null')
            }
        },
        _sliderCompileTemplate: function () {
            var sliderReg = /\{+\w+\}+/g;
            var sliderLocationReg = /\$\w+/g;
            var sliderTemplate = '';
            if (this.options.slider.location.length === 1) {
                if(Array.isArray(this.options.slider.name)){
                    this.options.slider.name = this.options.slider.name[0];
                }
                sliderTemplate = this.options.slider.template.replace(sliderReg, this.options.slider.name + this.options.slider.location[0]).replace(sliderLocationReg, this.options.slider.location[0]);
            }
            if (this.options.slider.location.length > 1) {
                for (var i = 0; i < this.options.slider.location.length; i += 1) {
                    if(Array.isArray(this.options.slider.name)){
                        sliderTemplate += this.options.slider.template.replace(sliderReg, this.options.slider.location[i]).replace(sliderLocationReg, this.options.slider.location[i]);
                    }
                    else {
                        sliderTemplate += this.options.slider.template.replace(sliderReg, this.options.slider.name + this.options.slider.location[i]).replace(sliderLocationReg, this.options.slider.location[i]);
                    }
                }
            }
            return sliderTemplate;
        },
        _slidersAreaExecute: function () {
            if(this.options.slidersArea.show && this.options.slider.location.length > 1){
                this.axis.slidersArea = this._slidersArea();
                if(this.options.slidersArea.drag){
                    Timeline.Drag(this.axis.slidersArea, {
                        start: function (that) {
                            if(this.axis.slidersMirror[0].offsetLeft > this.axis.slidersMirror[1].offsetLeft){
                                this.axis.slidersMirror = this._sliderArrChange(this.axis.sliders);
                            }
                            that.slidersTips = this._sliderScanTips(this.axis.slidersMirror, []).shift();
                            that.slidersTipsRight = this._sliderScanTips(this.axis.slidersMirror, []).pop();
                            that.previous.pointX = that.element.offsetLeft;
                            //that.lastPointX  = this.axisRecord[this.options.section[1]] - this.options.slider.width;
                            this.axis.slidersAreaCalculationWidth = parseFloat(getComputedStyle(this.axis.slidersArea)['width']);
                        }.bind(this),
                        limit: function (moveX, that) {
                            return this.disabled ? '':this._sliderCommonLimitJudge('sliderArea',moveX, that, this._slidersAreaJudgeCallback);
                        }.bind(this),
                        end:function () {
                            if(this.disabled)return false;
                            for(var j = 0; j < this.axis.slidersMirror.length; j += 1){
                                var tips = this._sliderScanTips(this.axis.sliders[j].childNodes,[]);
                                //var data = this.axis.recordData[this.axisRecord[tips[0].getAttribute('t-slider')]];
                                this.dataTime[j] = tips[0].getAttribute('t-slider');
                            }
                            if(typeof this.end === 'function'){
                                this.dataTime.sort(Timeline.sortNumber);
                                this.end(this.dataTime);
                            }
                        }.bind(this)
                    });
                }
            }
        },
        _slidersAreaJudgeCallback: function (moveX, that) {
            //slidersArea data
            var distance = 0;
            if (that.previous.pointX < moveX) {
                distance = moveX - that.previous.pointX;
                this.axis.slidersMirror[1].style.left = parseFloat(getComputedStyle(this.axis.slidersMirror[1])['left']) + distance + 'px';
                this._slidersAreaJudgeData(parseFloat(getComputedStyle(this.axis.slidersMirror[1])['left']),that);
            }
            if (that.previous.pointX > moveX) {
                distance = that.previous.pointX - moveX;
                this.axis.slidersMirror[1].style.left = (parseFloat(this.axis.slidersArea.offsetLeft) + this.axis.slidersAreaCalculationWidth - this.options.slider.width/2) - distance + 'px' ;//
                this._slidersAreaJudgeData(parseFloat(getComputedStyle(this.axis.slidersMirror[1])['left']),that);
            }
            that.previous.pointX = moveX;
            this.axis.slidersMirror[0].style.left = moveX - this.options.slider.width/2 + 'px';
            //slider data
            this._sliderJudgeData(moveX,that);
        },
        _slidersAreaJudgeData : function (moveX,that) {
            var pointArr = Timeline.jointArrayGroup(this.axis.recordPoint);
            for (var i = 0; i < pointArr.length; i += 1) {
                if (pointArr[i][0] < moveX && moveX < pointArr[i][1]) {
                    var pointValue = '';
                    pointValue = this.axis.recordData[pointArr[i][0]];
                    that.slidersTipsRight.setAttribute('t-slider',pointValue);
                    if(this.options.slider.name !== '' && !Array.isArray(this.options.slider.name)){
                        pointValue = this.options.slider.name + pointValue;
                    }
                    that.slidersTipsRight.innerHTML = pointValue;
                }
            }
        },
        _sliderCommonLimitJudge: function (type,moveX, that, callback) {
            var limitLeft  = 0,
                limitRight = 0;
            if(type === 'slider'){
                if(this.options.interval > 0 && this.options.precision === 'hours'){
                    limitRight = this.axis.totalWidth;
                }else {
                    limitRight = this.axis.totalWidth - this.options.axisTicks.width / 2 - this.options.slider.width/2;
                }
                limitLeft  = this.options.axisTicks.width / 2 - this.options.slider.width/2;
            }
            if(type === 'sliderArea'){
                if(this.options.interval > 0 && this.options.precision === 'hours'){
                    limitRight = this.axis.totalWidth - this.axis.slidersAreaCalculationWidth;
                }else {
                    limitRight = this.axis.totalWidth - this.options.axisTicks.width / 2 - this.axis.slidersAreaCalculationWidth;
                }
                limitLeft  = this.options.axisTicks.width / 2;
            }
            moveX = moveX < limitLeft  ? limitLeft  : moveX;
            moveX = moveX > limitRight ? limitRight : moveX;
            that.limitLeft  = limitLeft;
            that.limitRight = limitRight;
            callback.call(this, moveX, that);
            return moveX;
        },
        _slidersArea: function () {
            var slidersArea = doc.createElement('div');
            this._slidersAreaStyle(slidersArea);
            this.axis.element.appendChild(slidersArea);
            return slidersArea;
        },
        _slidersAreaStyle: function (sliderArea) {
            var positionTop = -this.options.slidersArea.height / 2;
            if (this.options.slidersArea.position === 'bottom') {
                positionTop = 0;
            }
            if (this.options.slider.location.length > 1) {
                for(var i = 0; i < this.options.slider.location.length; i += 1){
                    if((this.options.slider.location.length - 1) - i > 0){
                        var lastIndex = this.options.slider.location.length - 1;
                        if(typeof this.axisRecord[this.options.slider.location[i]] === 'undefined'){
                            this.axisRecord[this.options.slider.location[i]] = this.axisRecord[this.options.section[0]];
                        }
                        if(typeof this.axisRecord[this.options.slider.location[lastIndex]] === 'undefined'){
                            this.axisRecord[this.options.slider.location[lastIndex]] = this.axisRecord[this.options.section[1]];
                        }
                        this.axis.slidersAreaCalculationWidth = this.axisRecord[this.options.slider.location[lastIndex]] - this.axisRecord[this.options.slider.location[i]];
                    }
                }
            }
            var styles = {
                position: 'absolute',
                top: positionTop + 'px',
                width: this.axis.slidersAreaCalculationWidth + 'px',
                left:  this.axisRecord[this.options.slider.location[0]] + this.options.slider.width/2 + 'px',
                right: 0,
                background: this.options.slidersArea.bgColor,
                height: this.options.slidersArea.height + 'px'
            };
            for (var style in styles) {
                sliderArea.style[style] = styles[style];
            }
        },
        _slider: function () {
            this.axis.slidersMirror = this.axis.sliders = this._sliderToArr(Timeline.parseDom(this._sliderCompileTemplate()));
            if (this.options.slidersArea.show) {
                this._slidersAreaExecute();
            }
            this._sliderInitDrag();
        },
        _sliderInitPosition:function (elements,index) {
            elements['style']['left']  = this.axisRecord[this.options.slider.location[index]] + 'px';
            elements['style']['width'] = this.options.slider.width + 'px';
            this.dataTime[index] = this.options.slider.location[index];
            this.axis.element.appendChild(elements);
        },
        _sliderInitDrag : function () {
            for (var i = 0; i < this.axis.sliders.length; i += 1) {
                if(typeof this.axisRecord[this.options.slider.location[i]] === 'undefined'){
                    this.axisRecord[this.options.slider.location[i]] = this.axisRecord[this.options.section[i]];
                    console.warn('location is overflow');
                }
                this._sliderInitPosition(this.axis.sliders[i],i);
                Timeline.Drag(this.axis.sliders[i], {
                    start: function (that) {
                        that.slidersTips = this._sliderScanTips(that.element.childNodes, []).shift();
                        that.previous.pointX = this._sliderScanParent(that.slidersTips,[]).shift().offsetLeft;
                        //that.lastPointX = this.axisRecord[this.options.section[1]] - this.options.slider.width;
                        if(this.axis.slidersArea!== null){
                            that.slidersAreaCalculationWidth = Number((getComputedStyle(this.axis.slidersArea)['width']).replace(/px/,''));
                            that.slidersAreaLeft  = this.axis.slidersArea.offsetLeft;
                            that.slidersAreaRight = that.slidersAreaCalculationWidth + that.slidersAreaLeft;
                        }
                    }.bind(this),
                    limit: function (moveX, that) {
                        return this.disabled ? '':this._sliderCommonLimitJudge('slider',moveX, that, this._sliderJudgeCallback);
                    }.bind(this),
                    end:function () {
                        if(this.disabled)return false;
                        for(var j = 0; j < this.axis.sliders.length; j += 1){
                            var tips = this._sliderScanTips(this.axis.sliders[j].childNodes,[]);
                            //var data = this.axis.recordData[this.axisRecord[tips[0].getAttribute('t-slider')]];
                            this.dataTime[j] = tips[0].getAttribute('t-slider');
                            //this.dataTime[j] = data;
                        }
                        if(typeof this.end === 'function'){
                            this.dataTime.sort(Timeline.sortNumber);
                            this.end(this.dataTime);
                        }
                    }.bind(this)
                });
            }
        },
        _sliderJudgeCallback: function (moveX, that) {
            var updateMoveX = parseFloat(getComputedStyle(that.element)['left']);
            if (that.slidersAreaLeft >= that.previous.pointX && that.slidersAreaRight > that.previous.pointX) {
                if (moveX > that.slidersAreaRight) {
                    this.axis.slidersArea.style.left  = that.slidersAreaRight + 'px';
                    this.axis.slidersArea.style.width = moveX - that.slidersAreaRight + this.options.slider.width/2 + 'px';
                } else {
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + that.previous.pointX - moveX + 'px';
                    this.axis.slidersArea.style.left  = moveX + this.options.slider.width/2 + 'px';
                }
            }
            //that.slidersAreaRight <= that.previous.pointX && that.previous.pointX > that.slidersAreaLeft
            if (that.previous.pointX > that.slidersAreaLeft) {
                if (moveX < that.slidersAreaLeft) {
                    this.axis.slidersArea.style.width = that.slidersAreaLeft - moveX - this.options.slider.width/2 + 'px';
                    this.axis.slidersArea.style.left  = moveX + this.options.slider.width/2 + 'px';
                } else {
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + moveX - that.previous.pointX + 'px';
                    this.axis.slidersArea.style.left  = that.slidersAreaLeft  + 'px';
                }
            }
            //todo data
            this._sliderJudgeData(updateMoveX,that);
        },
        _sliderJudgeData:function (updateMove,that) {
            var pointGroup = Timeline.jointArrayGroup(this.axis.recordPoint);
            for (var i = 0; i < pointGroup.length; i += 1) {
                if (pointGroup[i][0] <= updateMove && updateMove < pointGroup[i][1]) {
                    var pointValue = '';
                    pointValue = this.axis.recordData[pointGroup[i][0]];
                    that.slidersTips.setAttribute('t-slider',pointValue);
                    if(this.options.slider.name !== '' && !Array.isArray(this.options.slider.name)){
                        pointValue = this.options.slider.name + pointValue;
                    }
                    that.slidersTips.innerHTML = pointValue;
                    this.drag(pointValue);
                }
            }
        },
        _sliderArrChange: function (array) {
            var arr = [];
            var first = array.shift();
            array.push(first);
            for(var i = 0 ; i < array.length; i += 1){
                arr[i] = array[i];
            }
            return arr;
        },
        _sliderScanTips: function (nodes, textArray) {
            for (var i = 0; i < nodes.length; i += 1) {
                if (nodes[i].nodeType === 1) {
                    this._sliderScanTips(nodes[i].childNodes, textArray);
                } else if (nodes[i].nodeType === 3) {
                    textArray.push(nodes[i].parentNode);
                }
            }
            return textArray;
        },
        _sliderScanParent: function (node,nodes) {
            if (node.parentNode != this.axis.element) {
                this._sliderScanParent(node.parentNode,nodes);
            } else {
                nodes.push(node);
            }
            return nodes;
        },
        _sliderToArr: function (nodes) {
            var nodesArr = [];
            for (var i = 0; i < nodes.length; i += 1) {
                nodesArr.push(nodes[i]);
            }
            return nodesArr;
        },
        _axisTemplate: function (width, axisItemFlag) {
            var axisTemplate;
            axisItemFlag ? axisTemplate = this._axisTicksTemplate(this._axisItemTicksTemplate.bind(this)) : axisTemplate = this._axisTicksTemplate();
            var axis = '<div style="' + this._axisTemplateStyle(width) + '">' + axisTemplate + '</div>';
            return axis;
        },
        _axisTemplateStyle: function (width) {
            var bdDirection = '';
            switch (this.options.axisStyle.bdDirection){
                case 'top':
                    bdDirection = 'border-top';
                    break;
                case 'bottom':
                    break;
                case 'left':
                    bdDirection = 'border-left';
                    break;
                case 'right':
                    bdDirection = 'border-right';
                    break;
                case 'all':
                    bdDirection = 'border';
                    break;
            };
            var styles = {
                position: 'absolute;',
                top: this.options.axisType === 'order' ? '50%;':'0;',
                left: '0;',
                right: '0;',
                bottom: '0;',
                width: width + 'px;',
                height:this.options.axisStyle.height + 'px;',
                background: this.options.axisStyle.bgColor + ';',
                transition: 'all 1s cubic-bezier(0.1, 0.57, 0.1, 1);',
                cursor: 'move;',
                borderRadius:{
                    name:'border-radius',
                    value: this.options.axisStyle.radius + 'px;'
                },
                border: {
                    name:  bdDirection,
                    value: this.options.axisStyle.bdSize + 'px ' + this.options.axisStyle.bdStyle + ' ' + this.options.axisStyle.bdColor + ';'
                }
            };
            var style = Timeline.generateStyle(styles);
            return style;
        },
        _axisTemplateWidth: function () {
            var sectionArea = this.options.section[this.options.section.length - 1] - this.options.section[0];
            var totalWidth = sectionArea * this.options.axisItemWidth + this.options.axisTicks.width;
            return totalWidth;
        },
        _axisTicksTemplate: function (fn) {
            if(!this.options.axisTicks.show)return '';
            if (typeof fn !== 'function') {
                fn = function () {
                    return '';
                };
            }
            var axisTicks = '';
            var sections = this._axisSectionOrder();
            
            var sectionArea = this.options.axisType === 'average'? (this.options.interval > 0 ? this.options.interval : (this.options.section[this.options.section.length - 1] - this.options.section[0] + 1)*this.options.slice):this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
            for (var i = 0; i < sectionArea; i += 1) {
                var stylesTicks = this._axisTicksTemplateStyle(i);
                axisTicks += '<div style="' + stylesTicks.ticks + '"><div style="' + stylesTicks.line + '"></div><div style="' + stylesTicks.text + '">' + sections[i] + '</div></div>' + fn(i, sectionArea) + '';
            }
            this.axis.ticksId = 'TimelineTciks'+('ticks' + Math.random()).replace(/\D/g, "");
            return '<div id="'+ this.axis.ticksId +'">'+ axisTicks +'</div>';
        },
        _axisTicksTemplateStyle: function (index) {
            var positions = 0;
            if(this.options.axisType === 'order'){
                positions = this._axisTicksPosition()[index];
            }
            if(this.options.axisType === 'average' && this.options.animation){
                positions = this.axis.totalWidth/2 - this.axis.axisItemTicksWidth/2;
            }
            var axisTicksStyles = {
                position: 'absolute;',
                width: this.options.axisTicks.width + 'px;',
                left: positions + 'px;',
                fontSize: {
                    name: 'font-size',
                    value: this.options.axisTicks.fontSize + 'px;'
                },
                textAlign: {
                    name: 'text-align',
                    value: 'center;'
                },
                userSelect: {
                    name: 'user-select',
                    value: 'none;'
                },
                transition: 'all 1s cubic-bezier(.77,0,.175,1);'
            };
            var axisTicksLineStyles = {
                position: 'absolute;',
                top: '0;',
                left: '50%;',
                width: this.options.axisTicksLineStyle.width + 'px;',
                height: this.options.axisTicksLineStyle.height + 'px;',
                background: this.options.axisTicksLineStyle.bgColor + ';'
            };
            var axisTicksTextStyles = {
                marginTop: {
                    name: 'margin-top',
                    value: this.options.axisTicksLineStyle.height + 'px;'
                },
                color: this.options.axisTicks.color + ';'
            };
            var styles = {
                ticks: Timeline.generateStyle(axisTicksStyles),
                line : Timeline.generateStyle(axisTicksLineStyles),
                text : Timeline.generateStyle(axisTicksTextStyles)
            };
            return styles;
        },
        _axisTicksPosition: function () {
            var section = this.options.axisType === 'average'?this.options.interval >0?this.options.interval:(this.options.section[this.options.section.length - 1] - this.options.section[0] + 1)*this.options.slice:this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
            var positions = [];
            while (section-- > 0) {
                positions.push(section * this.options.axisItemWidth);
            }
            return positions.reverse()
        },
        _axisItemTicksTemplate: function (index, allIndex) {
            var axisItemTicksTemp = '';
            if (index === (allIndex - 1)) {
                axisItemTicksTemp = ''
            } else {
                var axisItemTicks = this._axisItemTicks();
                axisItemTicksTemp = '<div style="' + this._axisItemTicksTemplateStyle(index) + '">' + axisItemTicks + '</div>';
            }
            return axisItemTicksTemp;
        },
        _axisItemTicks: function () {
            var axisItemTicks = '';
            var month = this._axisMonthOrder();
            for (var i = 0; i < month.length; i += 1) {
                axisItemTicks += '<div style="' + this._axisItemTicksStyle(i).ticks + '"><div style="' + this._axisItemTicksStyle(i).line + '"></div><div style="' + this._axisItemTicksStyle(i).text + '">' + month[i] + '</div></div>';
            }
            return axisItemTicks;
        },
        _axisItemTicksTemplateStyle: function (index) {
            var axisItemTicksTemplatePositions = this._axisItemTicksTemplatePositions();
            var styles = {
                position: 'absolute;',
                width: this.options.axisItemWidth - this.options.axisTicks.width + 'px;',
                left: axisItemTicksTemplatePositions[index] + 'px;',
                transition: 'all 1s cubic-bezier(0.1, 0.57, 0.1, 1);',
                height: '1px;'
            };
            var style = Timeline.generateStyle(styles);
            return style;
        },
        _axisItemTicksTemplatePositions: function () {
            var axisTicksPosition = this._axisTicksPosition();
            var positions = [];
            for (var i = 0; i < axisTicksPosition.length; i += 1) {
                positions.push(axisTicksPosition[i] + this.options.axisTicks.width)
            }
            return positions;
        },
        _axisItemTicksPosition: function () {
            var MONTH = 12;
            var positions = [];
            while (MONTH-- > 0) {
                positions.push(MONTH * this.axis.axisItemTicksWidth);
            }
            return positions.reverse();
        },
        _axisItemTicksStyle: function (index) {
            var positions = this._axisItemTicksPosition();
            var axisItemTicksStyles = {
                position: 'absolute;',
                width: (this.options.axisItemWidth - this.options.axisTicks.width) / 12 + 'px;',
                left: positions[index] + 'px;',
                fontSize: {
                    name: 'font-size',
                    value: this.options.axisItemTicksStyle.fontSize + 'px;'
                },
                textAlign: {
                    name: 'text-align',
                    value: 'center;'
                },
                userSelect: {
                    name: 'user-select',
                    value: 'none;'
                },
                transition: 'all 1s cubic-bezier(.77,0,.175,1);'
            };
            var axisItemTicksLineStyles = {
                position: 'absolute;',
                top: '0;',
                left: '50%;',
                width: this.options.axisItemTicksStyle.width + 'px;',
                height: this.options.axisItemTicksStyle.height + 'px;',
                background: this.options.axisItemTicksStyle.bgColor + ';'
            };
            var axisItemTicksTextStyles = {
                marginTop: {
                    name: 'margin-top',
                    value: this.options.axisItemTicksStyle.height + 'px;'
                },
                color: this.options.axisItemTicksStyle.color + ';'
            };
            var styles = {
                ticks: Timeline.generateStyle(axisItemTicksStyles),
                line : Timeline.generateStyle(axisItemTicksLineStyles),
                text : Timeline.generateStyle(axisItemTicksTextStyles)
            };
            return styles;
        },
        _axisSectionOrder: function () {
            if(this.options.interval > 0 && this.options.precision === 'hours'){
                var sections  = [];
                var sectionsDate = [];
                var startDate = this.options.section[0];
                var endDate  = this.options.section[1];
                if((endDate-startDate)>0){
                    if((this.axis.intervalDate.day - startDate) >= 0){
                        for(;startDate <= endDate;){
                            sectionsDate.push(startDate);
                            startDate++;
                        }
                        sections = sections.concat(sectionsDate);
                    }
                    return sections;
                }
                if((endDate-startDate)<0){
                    if((this.axis.intervalDate.day - startDate) >= 0){
                        for(;startDate <= this.axis.intervalDate.day;){
                            sectionsDate.push(startDate);
                            startDate++;
                        }
                        for(var i = 1; i <= endDate;i+=1){
                            sectionsDate.push(i);
                        }
                        sections = sections.concat(sectionsDate);
                    }
                    return sections;
                }
            }else{
                var sectionTotal = this.options.section[this.options.section.length - 1] - this.options.section[0];
                var sections = [];
                var index = 0;
                while (sectionTotal-- >= 0) {
                    sections.push(this.options.section[0] + index++);
                }
                if(this.options.axisType === 'average' && this.options.slice > 1){
                    for(var i = 1; i < this.options.slice; i += 1){
                        sections = sections.concat(sections);
                    }
                }
                return sections;
            }
        },
        _axisMonthOrder: function () {
            var month = [];
            var MONTH_NUMBER = 12;
            for (var i = 1; i <= MONTH_NUMBER; i += 1) {
                var ii = i.toString();
                if (ii.length === 1) {
                    ii = '0' + ii;
                }
                month.push(ii)
            }
            return month;
        },
        _axisDayOrder: function () {
            var axisSectionOrder = this._axisSectionOrder();
            var MONTH_NUMBER = 12;
            var axisDayOrder = [];
            for (var i = 0; i < axisSectionOrder.length; i += 1) {
                var days = [];
                if(i !== (axisSectionOrder.length - 1)){
                    for (var ii = 1; ii <= MONTH_NUMBER; ii += 1) {
                        var day = new Date(axisSectionOrder[i], ii, 0);
                        days.push(day.getDate());
                    }
                    axisDayOrder.push(days);
                }
            }
            return axisDayOrder;
        },
        _axisHoursOrder:function () {
            var hours = [];
            for (var i = 0; i <= 23; i += 1) {
                if (i < 10) {
                    var ii = '0' + i.toString();
                    hours.push(ii);
                } else {
                    hours.push(i);
                }
            }
            return hours;
        },
        _axisMinuteOrder:function () {
            var MINUTE_NUMBER = 60;
            var minute = [];
            for(var i = 0 ; i < MINUTE_NUMBER; i += 1){
                var m = i;
                if(i < 10){
                    m = '0' + i;
                }
                minute.push(m);
            }
            return minute;
        },
        _axisPrecisionDayOrder:function () {
            var date = new Date();
            var YEAR = date.getFullYear();
            var MONTH_NUMBER = 12;
            var axisPrecisionDayOrder = [];
            for(var i = 1 ; i <= MONTH_NUMBER; i+=1){
                var day = new Date(YEAR,i,0);
                var days = [];
                var dayFormat = day.getDate();
                for(var d = 1; d <= dayFormat; d += 1){
                    var dd = d.toString();
                    if (dd.length === 1) {
                        dd = '0' + dd;
                    }
                    days.push(dd);
                }
                axisPrecisionDayOrder.push(days);
            }
            return axisPrecisionDayOrder;
        },
        _axisPrecisionDaySection:function (sections) {
            var currentDate = new Date();
            var currentDateDay = currentDate.getDate();
            //section
            var currentDateYear = currentDate.getFullYear();
            var currentDateMonth= currentDate.getMonth();
            if(currentDateDay - this.options.interval >= 0){
                var frontToDate = new Date(currentDateYear,currentDateMonth+1,currentDateDay - this.options.interval);
                var frontToDateDay = currentDateDay - this.options.interval === 0 ? 1 : frontToDate.getDate()+1;
                var frontToDateAllDay = new Date(currentDateYear,currentDateMonth+1,0);
                sections = [frontToDateDay,currentDateDay];
                this.axis.intervalDate.year  = currentDateYear;
                this.axis.intervalDate.month = currentDateMonth+1;
                this.axis.intervalDate.day   = frontToDateAllDay.getDate();
            }
            if(currentDateDay - this.options.interval < 0){
                var _frontToDate = new Date(currentDateYear,currentDateMonth,currentDateDay - this.options.interval);
                var frontToDay   = new Date( _frontToDate.getFullYear(),_frontToDate.getMonth()+1,0);
                sections = [_frontToDate.getDate()+1,currentDateDay];
                this.axis.intervalDate.year  = _frontToDate.getFullYear();
                this.axis.intervalDate.month = _frontToDate.getMonth()+1;
                this.axis.intervalDate.day   = frontToDay.getDate();
                if(this.axis.intervalDate.year<currentDateYear){
                    this.axis.intervalDate.crossYear = true;
                    if(this.axis.intervalDate.month>currentDateMonth+1){
                        this.axis.intervalDate.crossMonth= true;
                    }
                }else{
                    if(this.axis.intervalDate.month<currentDateMonth+1){
                        this.axis.intervalDate.crossMonth= true;
                    }
                }
                
            }
            return sections;
        },
        _initAxisPrecisionDaySection:function(){
            var precisionDaySection = {
                section : [],
                intervalDate:{
                    year:0,
                    month:0,
                    day:0,
                    crossYear:false,
                    crossMonth:false
                },
                interval:7
            };
            var currentDate = new Date();
            var currentDateDay = currentDate.getDate();
            //section
            var currentDateYear = currentDate.getFullYear();
            var currentDateMonth= currentDate.getMonth();
            if(currentDateDay - precisionDaySection.interval >= 0){
                var frontToDate = new Date(currentDateYear,currentDateMonth+1,currentDateDay - precisionDaySection.interval);
                var frontToDateDay = currentDateDay - precisionDaySection.interval === 0 ? 1 : frontToDate.getDate()+1;
                var frontToDateAllDay = new Date(currentDateYear,currentDateMonth+1,0);
                precisionDaySection.section = [frontToDateDay,currentDateDay];
                precisionDaySection.intervalDate.year  = currentDateYear;
                precisionDaySection.intervalDate.month = currentDateMonth+1;
                precisionDaySection.intervalDate.day   = frontToDateAllDay.getDate();
            }
            if(currentDateDay - precisionDaySection.interval < 0){
                var _frontToDate = new Date(currentDateYear,currentDateMonth,currentDateDay - precisionDaySection.interval);
                var frontToDay   = new Date(_frontToDate.getFullYear(),_frontToDate.getMonth()+1,0);
                precisionDaySection.section = [_frontToDate.getDate()+1,currentDateDay];
                precisionDaySection.intervalDate.year  = _frontToDate.getFullYear();
                precisionDaySection.intervalDate.month = _frontToDate.getMonth()+1;
                precisionDaySection.intervalDate.day   = frontToDay.getDate();
                if(precisionDaySection.intervalDate.year<currentDateYear){
                    precisionDaySection.intervalDate.crossYear = true;
                    if(precisionDaySection.intervalDate.month>currentDateMonth+1){
                        precisionDaySection.intervalDate.crossMonth= true;
                    }
                }else{
                    if(precisionDaySection.intervalDate.month<currentDateMonth+1){
                        precisionDaySection.intervalDate.crossMonth= true;
                    }
                }
            }
            return precisionDaySection;
        },
        _precisionGetDaySectionAndHours:function (sections,precision) {
            var _sections = [];
            if(!precision.intervalDate.crossYear){
                if(precision.intervalDate.crossMonth){
                    var currentMonth = precision.intervalDate.month + 1;
                    for(var i = 0 ; i < sections.length; i += 1){
                        var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                        if(sections[i] > precision.interval){
                            _sections[i] = precision.intervalDate.year + '-' + (precision.intervalDate.month<10?'0'+precision.intervalDate.month:precision.intervalDate.month) + '-' + s;
                        }else{
                            _sections[i] = precision.intervalDate.year + '-' + (currentMonth<10?'0'+currentMonth:currentMonth) + '-' + s;
                        }
                    }
                    sections = _sections;
                }else{
                    for(var i = 0 ; i < sections.length; i +=1){
                        var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                        _sections[i] = precision.intervalDate.year + '-' + (precision.intervalDate.month<10?'0'+precision.intervalDate.month:precision.intervalDate.month) + '-' + s
                    }
                    sections = _sections;
                }
            }
            if(precision.intervalDate.crossYear){
                var currentYear  = precision.intervalDate.year  + 1;
                var currentMonth = 1;
                for(var i = 0 ; i < sections.length; i += 1){
                    var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                    if(sections[i] > precision.interval){
                        _sections[i] = precision.intervalDate.year + '-' + (precision.intervalDate.month<10?'0'+precision.intervalDate.month:precision.intervalDate.month) + '-' + s;
                    }else{
                        _sections[i] = currentYear + '-' + (currentMonth<10?'0'+currentMonth:currentMonth) + '-' + s;
                    }
                }
                sections = _sections;
            }
            return sections;
        },
        _precisionDaySectionAndHours:function (sections) {
            var _sections = [];
            if(!this.axis.intervalDate.crossYear){
                if(this.axis.intervalDate.crossMonth){
                    var currentMonth = this.axis.intervalDate.month + 1;
                    for(var i = 0 ; i < sections.length; i += 1){
                        var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                        if(sections[i] > this.options.interval){
                            _sections[i] = this.axis.intervalDate.year + '-' + (this.axis.intervalDate.month<10?'0'+this.axis.intervalDate.month:this.axis.intervalDate.month) + '-' + s;
                        }else{
                            _sections[i] = this.axis.intervalDate.year + '-' + (currentMonth<10?'0'+currentMonth:currentMonth) + '-' + s;
                        }
                    }
                    sections = _sections;
                }else{
                    for(var i = 0 ; i < sections.length; i +=1){
                        var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                        _sections[i] = this.axis.intervalDate.year + '-' + (this.axis.intervalDate.month<10?'0'+this.axis.intervalDate.month:this.axis.intervalDate.month) + '-' + s
                    }
                    sections = _sections;
                }
            }
            if(this.axis.intervalDate.crossYear){
                var currentYear  = this.axis.intervalDate.year  + 1;
                var currentMonth = 1;
                for(var i = 0 ; i < sections.length; i += 1){
                    var s = sections[i] < 10 ? '0' + sections[i]:sections[i];
                    if(sections[i] > this.options.interval){
                        _sections[i] = this.axis.intervalDate.year + '-' + (this.axis.intervalDate.month<10?'0'+this.axis.intervalDate.month:this.axis.intervalDate.month) + '-' + s;
                    }else{
                        _sections[i] = currentYear + '-' + (currentMonth<10?'0'+currentMonth:currentMonth) + '-' + s;
                    }
                }
                sections = _sections;
            }
            return sections;
        },
        _axisRecord: function () {
            //year
            var sections = this._axisSectionOrder();
            var sectionsPoint = this._axisSectionPoint(sections);
            //todo
            //console.log(sections);
            //slice
            if(this.options.axisType === 'average' && this.options.slice > 1 && Array.isArray(this.options.slider.name)){
                var sectionTotal = this.options.section[this.options.section.length - 1] - this.options.section[0];
                sections = [];
                for(var k = 0; k < this.options.slice; k += 1){
                    var _sections = [];
                    for(var j = 0; j <= sectionTotal; j += 1){
                        _sections[j] = this.options.slider.name[k] + j;
                    }
                    sections = sections.concat(_sections);
                }
            }
            //precision average is type
            switch (this.options.precision){
                case 'month':
                    var mark = '-';
                    var precision = this._axisMonthOrder();
                    var precisionPoint = this._axisPrecisionPoint(sections,sectionsPoint,precision);
                    break;
                case 'day':
                    var mark = '-';
                    var precision = this._axisPrecisionDayOrder();
                    var precisionPoint = this._axisPrecisionPoint(sections,sectionsPoint,precision);
                    break;
                case 'hours':
                    var mark = ' ';
                    var precision = this._axisHoursOrder();
                    var precisionPoint = this._axisPrecisionPoint(sections,sectionsPoint,precision);
                    break;
                case 'minute':
                    var mark = ':';
                    var precision = this._axisMinuteOrder();
                    var precisionPoint = this._axisPrecisionPoint(sections,sectionsPoint,precision);
                    break;
                case 'second':
                    break;
                default:
                    break;
            }
            //order
            if(this.options.axisType === 'order'){
                //month
                var month = this._axisMonthOrder();
                var monthPoint = this._axisMonthPoint(sections,month);
                //day
                var day = this._axisDayOrder();
                var dayPoint = this._axisDayPoint(monthPoint,day);
            }
            //record core
            var axisRecord = {};

            if(this.options.intervalCurrent === true && this.options.precision === 'hours'){
                sections = this._precisionDaySectionAndHours(sections);
                console.log(sections);
            }
            for (var i = 0, l = sections.length; i < l; i += 1) {
                axisRecord[sections[i]] = sectionsPoint[i] - this.options.slider.width/2;
                if(i !== 0) {
                    this.axis.recordData[sectionsPoint[i] - this.options.slider.width/2] = sections[i].toString();
                    this.axis.recordData[sectionsPoint[i] - this.options.slider.width] =   sections[i].toString();
                    this.axis.recordData[sectionsPoint[i]]= sections[i].toString();
                    this.axis.recordPoint.push(sectionsPoint[i] - this.options.slider.width, sectionsPoint[i] - this.options.slider.width/2, sectionsPoint[i]);
                }else{
                    this.axis.recordData[sectionsPoint[i] - this.options.slider.width/2] = sections[i].toString();
                    this.axis.recordData[sectionsPoint[i]]= sections[i].toString();
                    this.axis.recordPoint.push(sectionsPoint[i] - this.options.slider.width/2,sectionsPoint[i]);
                }
                //average is precision
                if(this.options.precision !== 'default'){
                    if(this.options.intervalCurrent !== true){
                        if(i !== (sections.length - 1)){
                            if(this.options.precision !== 'day'){
                                for(var o = 0; o < precision.length; o += 1){
                                    this.axis.recordData[precisionPoint[i][o] - this.options.slider.width/2] = sections[i].toString() + mark + precision[o];
                                    this.axis.recordPoint.push(precisionPoint[i][o] - this.options.slider.width/2);
                                }
                            }else{
                                for(var d =0;d < precision[i].length; d+=1){
                                    this.axis.recordData[precisionPoint[i][d] - this.options.slider.width/2] = sections[i].toString() + mark + precision[i][d];
                                    this.axis.recordPoint.push(precisionPoint[i][d] - this.options.slider.width/2);
                                }
                            }
                        }
                    } else{
                        //hours
                        for(var o = 0; o < precision.length; o += 1){
                            if(typeof precisionPoint[i][o] !== 'undefined'){
                                this.axis.recordData[precisionPoint[i][o] - this.options.slider.width/2] = sections[i].toString() + mark + precision[o] + ':00';
                                this.axis.recordPoint.push(precisionPoint[i][o] - this.options.slider.width/2);
                            }
                        }
                    }
                }
                //order
                if(this.options.axisType === 'order'){
                    if (i !== (sections.length - 1)) {
                        for (var m = 0; m < month.length; m += 1) {
                            axisRecord[sections[i] + '-' + month[m]] = Math.ceil(monthPoint[i][m]);
                            this.axis.recordData[Math.ceil(monthPoint[i][m]) - this.options.slider.width/2] = sections[i] + '-' + month[m];
                            this.axis.recordPoint.push(Math.ceil(monthPoint[i][m]) - this.options.slider.width/2);
                            var days = day[i][m];
                            for(var d = 0; d < days; d += 1){
                                var repairDay = d < 10 ? ('-0'+d):'-'+(d+1);
                                repairDay = d === 0 ? '': repairDay;
                                axisRecord[sections[i] + '-' + month[m] + repairDay] = dayPoint[i][m][d];
                                this.axis.recordData[dayPoint[i][m][d] - this.options.slider.width/2 ] = sections[i] + '-' + month[m] + repairDay;
                                this.axis.recordPoint.push(dayPoint[i][m][d] - this.options.slider.width/2);
                            }
                        }
                    }
                }
            }
            if(this.axis.axisItemTicksWidth > this.options.slider.width){
                this.axis.recordPoint.sort(Timeline.sortNumber);
            }
            return axisRecord;
        },
        _axisPrecisionPoint:function (sections,point,order) {
            var axisPrecisionPoint = [];
            for(var i = 0;i < sections.length; i += 1){
                var precisionPoints = [];
                if(this.options.interval === 0 && this.options.precision !== 'hours' && this.options.intervalCurrent !== true){
                    if (i !== (sections.length - 1)) {
                        if (Array.isArray(order[0])) {
                            for (var ii = 0; ii < order[i].length; ii += 1) {
                                var precisionPoint = point[i] + (this.axis.axisItemTicksWidth / order[i].length) * ii + (this.axis.axisItemTicksWidth / order[i].length) / 2;
                                precisionPoints.push(precisionPoint);
                            }
                        } else {
                            for (var j = 0; j < order.length; j += 1) {
                                var precisionPoint = point[i] + (this.axis.axisItemTicksWidth / order.length) * j + (this.axis.axisItemTicksWidth / order.length) / 2;
                                precisionPoints.push(precisionPoint);
                            }
                        }
                        axisPrecisionPoint.push(precisionPoints);
                    }
                }else{
                    if(i === sections.length - 1){
                        var hours = [];
                        var date  = new Date();
                        var currentHours = date.getHours() + 1;
                        for(var h = 0;h <= currentHours; h +=1){
                            if(h < 10){
                                var hh = '0' + h.toString();
                                hours.push(hh);
                            }else{
                                hours.push(h)
                            }
                        }
                        order = hours;
                    }
                    for(var k = 0; k < order.length; k += 1){
                        if(i !== sections.length - 1){
                            var precisionPoint = point[i] + (this.axis.axisItemTicksWidth/order.length)*k + (this.axis.axisItemTicksWidth/order.length)/2;
                            precisionPoints.push(precisionPoint);
                        }else {
                            var precisionPointLast = point[i] + ((this.axis.axisItemTicksWidth/2)/order.length)*k + ((this.axis.axisItemTicksWidth/2)/order.length)/2;
                            precisionPoints.push(precisionPointLast);
                        }

                    }
                    axisPrecisionPoint.push(precisionPoints);
                }
            }
            return axisPrecisionPoint;
        },
        //计算中心点的位置
        _axisSectionPoint: function (sections) {
            var positions = [];
            for(var i = 0 ; i < sections.length; i += 1){
                var point = i * this.options.axisItemWidth + this.options.axisTicks.width/2;
                //console.log(i , this.options.axisItemWidth , this.options.axisTicks.width/2);
                positions.push(point);
            }
            return positions;
        },
        _axisMonthPoint: function (sections,month) {
            var axisTicksPosition = this._axisTicksPosition();
            var axisMonthPoint = [];
            for (var i = 0; i < sections.length; i += 1) {
                var pointMonth = [];
                if (i !== (sections.length - 1)) {
                    for (var j = 0; j < month.length; j += 1) {
                        var monthPoint = axisTicksPosition[i] + this.options.axisTicks.width + this.axis.axisItemTicksWidth * j +this.axis.axisItemTicksWidth/2;
                        pointMonth.push(monthPoint);
                    }
                    axisMonthPoint.push(pointMonth);
                }
            }
            return axisMonthPoint;
        },
        _axisDayPoint: function (monthPoint,day) {
            var axisDayPoint = [];
            for(var i = 0; i < monthPoint.length; i += 1){
                var daySplitPoint = [];
                for(var m = 0; m < monthPoint[i].length; m += 1){
                    var days = day[i][m];
                    var dayAllPoint = [];
                    for(var d = 0; d < days; d += 1){
                        var dayWidth = parseFloat((this.axis.axisItemTicksWidth/days).toFixed(2));
                        var dayWidthHalf = parseFloat((dayWidth/2).toFixed(2));
                        var dayPoint = monthPoint[i][m] + dayWidth * d + dayWidthHalf;
                        dayAllPoint.push(dayPoint);
                    }
                    daySplitPoint.push(dayAllPoint);
                }
                axisDayPoint.push(daySplitPoint);
            }
            return axisDayPoint;
        },
    };
    Timeline.Drag = function (element, options) {
        if (!(this instanceof Timeline.Drag)) {
            return new Timeline.Drag(element, options);
        }
        this.data = {
            element: element,
            pointX: 0,
            pointY: 0,
            previous: {
                pointX: 0,
                pointY: 0
            },
            flag: false
        };
        this.options = {
            limit: null,
            start: null,
            end: null
        };
        for (var k in options) {
            if(this.options.hasOwnProperty(k)){
                this.options[k] = options[k];
            }
        }
        this._dragInit();
    };
    Timeline.Drag.prototype = {
        handleEvent: function (event) {
            var event = event || window.event;
            switch (event.type) {
                case 'mousedown':
                    this._dragStartExecute(event);
                    break;
                case 'mousemove':
                    this._dragMoveExecute(event);
                    break;
                case 'mouseup':
                    this._dragEndExecute(event);
                    break;
            }
        },
        _dragInit: function () {
            try {
                this._dragStart();
            } catch (e) {
                console.warn('element is null or error!')
            }
            this._dragMove();
            this._dragEnd();
        },
        _dragStart: function () {
            this.data.element.id = 'TimelineDrag'+('drag' + Math.random()).replace(/\D/g, "");
            this.data.element.addEventListener('mousedown', this, false)
        },
        _dragStartExecute: function (event) {
            event.cancelBubble = true;
            event.stopPropagation();
            event.target.setCapture && event.target.setCapture();
            this.data.flag = true;
            this.data.pointX = event.clientX - this.data.element.offsetLeft;
            if (this.options.start !== null && typeof this.options.start === 'function') this.options.start(this.data);
            return false;
        },
        _dragMove: function () {
            doc.addEventListener('mousemove', this, false);
        },
        _dragMoveExecute: function (event) {
            if (!this.data.flag)return false;
            var moveX = event.clientX - this.data.pointX;
            var pointMoveX = this.options.limit !== null && typeof this.options.limit === 'function' ? this.options.limit(moveX, this.data) : moveX;
            this.data.element['style']['left'] = pointMoveX + 'px';
            return false;
        },
        _dragEnd: function () {
            doc.addEventListener('mouseup', this, false);
            try {
                this.data.element.addEventListener('losecapture', this, false);
            } catch (e) {
                console.warn('element is null or error!')
            }
        },
        _dragEndExecute: function (event) {
            this._dragEndJudge(this.data.element,event.target,function (element) {
                if(this.options.end !== null && typeof this.options.end === 'function') this.options.end(element,this.data);
            });
            event.cancelBubble = true;
            event.stopPropagation();
            this.data.flag = false;
            this.data.element.releaseCapture && this.data.element.releaseCapture();
            this.data.previous.pointX = event.clientX - this.data.pointX;
        },
        _dragEndJudge:function (element,target,fn) {
            if(this.data.flag && target !== null){
                if(element != target){
                    if(target.nodeName.replace('#','') === 'document'){
                        fn.call(this,element);
                    }
                    this._dragEndJudge(element,target.parentNode,fn);
                }else if(element == target){
                    fn.call(this,element);
                    return true;
                }
            }
        }
    };
    Timeline.generateStyle = function (styles) {
        var style = '';
        for (var key in styles) {
            if (Timeline.isObject(styles[key])) {
                style += styles[key].name + ":" + styles[key].value;
            } else {
                style += key + ":" + styles[key];
            }
        }
        return style;
    };
    Timeline.parseDom = function (str) {
        var dom = document.createElement('div');
        dom.innerHTML = str;
        return dom.childNodes;
    };
    Timeline.extends = function (source, target) {
        for (var k in target) {
            if (source.hasOwnProperty(k)) {
                if (Timeline.isObject(target[k])) {
                    Timeline.extends(source[k], target[k]);
                } else {
                    source[k] = target[k];
                }
            }
        }
    };
    Timeline.copy = function (s, t) {
        for (var i in t) {
            s[i] = t[i];
        }
        return s;
    };
    Timeline.jointArrayGroup = function (arr) {
        var jointArrayGroup = [];
        var index = 0;
        for (var i = 0; i < arr.length; i += 1) {
            var group = [];
            index++;
            if (i !== (arr.length - 1)) {
                group.push(arr[i], arr[index]);
                jointArrayGroup.push(group);
            }
        }
        return jointArrayGroup;
    };
    Timeline.sortNumber = function (a,b) {
          return a - b;
    };
    Timeline.isObject = function () {
        var arg = [].slice.call(arguments)[0];
        return Object.prototype.toString.call(arg) === '[object Object]';
    };
    Timeline.copy(timeLine.prototype, TimeLineMethods);
    return Timeline();
}));