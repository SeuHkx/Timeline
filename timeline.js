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
            section: [2012, 2017],
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
                template: '<div class="timeline-slide"><div class="slide-tips">${location}</div><div class="slide"></div></div>',
                location: ['2012-02', '2013'],
                width: 14
            },
            axisType: 'order' || 'average',
            axisStyle: {
                height:1,
                bgColor: 'transparent',
                bdSize :1,
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
                unit:''
            },
            axisTicksLineStyle: {
                height: 28,
                width: 1,
                bgColor: '#bfbfbf'
            },
            axisItemWidth: 700,
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
            width: this._axisTemplateWidth(),
            slidersArea: null,
            slidersAreaCalculationWidth: 0,
            recordPoint: [],
            recordData: {}
        };
        this._axisItemTicksWidth = (this.options.axisItemWidth - this.options.axisTicks.width)/12;
        this.axisRecord = this._axisRecord();
        if (this.options.axisType === 'order') {
            this.axis.element = Timeline.parseDom(this._axisTemplate(this.axis.width, true))[0];
            this._render();
        }
        if (this.options.axisType === 'average') {
            this._renderTypeAverage();
        }
        this.zoomIn = function () {
            console.log('zoomIn')
        };
        this.zoomOut = function () {
            console.log('zoomOut')
        };
        this.drag = function () {
        };
        this.dataTime = [];
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
            if (this.options.axisType === 'order') {
                this._renderTypeOrder();
            } else {
                this._renderTypeAverage();
            }
        };
    };
    var TimelineMethods = {
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
            try {
                var renderToWidth = parseInt(getComputedStyle(this.axis.renderTo)['width']);
            } catch (e) {
                console.warn('renderTo is error or renderTo is null')
            }
            this.axis.recordPoint = [];
            this.axis.recordData  = {};
            this.axis.width = renderToWidth;
            this.options.axisTicks.width = this.options.axisItemWidth = renderToWidth / (this.options.section[this.options.section.length - 1] - this.options.section[0] + 1);
            this.axis.element = Timeline.parseDom(this._axisTemplate(renderToWidth, false))[0];
            this.axisRecord = this._axisRecord();
        },
        _renderTypeOrder:function () {
            this.axis.recordPoint = [];
            this.axis.recordData  = {};
            this.axis.width   = this._axisTemplateWidth();
            this.axis.element = Timeline.parseDom(this._axisTemplate(this.axis.width, true))[0];
            this.axisRecord = this._axisRecord();
            this._axisItemTicksWidth = (this.options.axisItemWidth - this.options.axisTicks.width)/12;
            this._render();
        },
        _render: function () {
            var styles = {
                position: 'relative',
                overflow: 'hidden',
                width: '100%'
            };
            this._renderToStyle(styles);
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
            } catch (e) {
                console.warn('renderTo is error or renderTo is null')
            }
        },
        _sliderCompileTemplate: function () {
            var sliderReg = /\$\{\w+\}/g;
            var sliderTemplate = '';
            if (this.options.slider.location.length === 1) {
                sliderTemplate = this.options.slider.template.replace(sliderReg, this.options.slider.location[0]);
            }
            if (this.options.slider.location.length > 1) {
                for (var i = 0; i < this.options.slider.location.length; i += 1) {
                    sliderTemplate += this.options.slider.template.replace(sliderReg, this.options.slider.location[i]);
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
                            that.lastPointX  = this.axisRecord[this.options.section[1]] - this.options.slider.width;
                            this.axis.slidersAreaCalculationWidth = parseInt(getComputedStyle(this.axis.slidersArea)['width']);
                        }.bind(this),
                        limit: function (moveX, that) {
                            return this._sliderCommonLimitJudge('sliderArea',moveX, that, this._slidersAreaJudgeCallback);
                        }.bind(this)
                    });
                }
            }
        },
        _slidersAreaJudgeCallback: function (moveX, that) {
            //todo
            var distance = 0;
            if (that.previous.pointX < moveX) {
                distance = moveX - that.previous.pointX;
                this.axis.slidersMirror[1].style.left = parseInt(getComputedStyle(this.axis.slidersMirror[1])['left']) + distance + 'px';
                this._slidersAreaJudgeData(parseInt(getComputedStyle(this.axis.slidersMirror[1])['left']),that);
            }
            if (that.previous.pointX > moveX) {
                distance = that.previous.pointX - moveX;
                this.axis.slidersMirror[1].style.left = (parseInt(this.axis.slidersArea.offsetLeft) + this.axis.slidersAreaCalculationWidth - this.options.slider.width/2) - distance + 'px' ;//
                this._slidersAreaJudgeData(parseInt(getComputedStyle(this.axis.slidersMirror[1])['left']),that);
            }
            that.previous.pointX = moveX;
            this.axis.slidersMirror[0].style.left = moveX - this.options.slider.width/2 + 'px';
            //todo data
            this._sliderJudgeData(moveX,that);
        },
        _slidersAreaJudgeData : function (moveX,that) {
            var pointArr = Timeline.jointArrayGroup(this.axis.recordPoint);
            for (var i = 0; i < pointArr.length; i += 1) {
                if (pointArr[i][0] < moveX && moveX < pointArr[i][1]) {
                    var pointValue = '';
                    pointValue = this.axis.recordData[pointArr[i][0]];
                    if(moveX > that.lastPointX){
                        pointValue = this.axis.recordData[pointArr[i][1]];
                    }
                    that.slidersTipsRight.innerHTML = pointValue;
                }
            }
            if(typeof this.dataTime[0] === 'undefined')this.dataTime[0] = this.options.slider.location[0];
            if(typeof pointValue !== 'undefined')this.dataTime[1] = pointValue;
        },
        _sliderCommonLimitJudge: function (type,moveX, that, callback) {
            var limitLeft  = 0,
                limitRight = 0;
            if(type === 'slider'){
                limitLeft  = this.options.axisTicks.width / 2 - this.options.slider.width/2;
                limitRight = this.axis.width - this.options.axisTicks.width / 2 - this.options.slider.width/2;
            }
            if(type === 'sliderArea'){
                limitLeft  = this.options.axisTicks.width / 2;
                limitRight = this.axis.width - this.options.axisTicks.width / 2 - this.axis.slidersAreaCalculationWidth;
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
                left: this.axisRecord[this.options.slider.location[0]] + 'px',
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
            elements['style']['left']  = this.axisRecord[this.options.slider.location[index]] - this.options.slider.width/2 + 1 + 'px';
            elements['style']['width'] = this.options.slider.width + 'px';
            this.axis.element.appendChild(elements);
        },
        _sliderInitDrag : function () {
            for (var i = 0; i < this.axis.sliders.length; i += 1) {
                if(typeof this.axisRecord[this.options.slider.location[i]] === 'undefined'){
                    this.axisRecord[this.options.slider.location[i]] = this.axisRecord[this.options.section[i]];
                    console.warn('location is overflow');
                }
                this._sliderInitPosition(this.axis.sliders[i],i);
                //todo drag end
                Timeline.Drag(this.axis.sliders[i], {
                    start: function (that) {
                        that.slidersTips = this._sliderScanTips(that.element.childNodes, []).shift();
                        that.previous.pointX = this._sliderScanParent(that.slidersTips,[]).shift().offsetLeft;
                        that.lastPointX = this.axisRecord[this.options.section[1]] - this.options.slider.width;
                        if(this.axis.slidersArea!== null){
                            that.slidersAreaCalculationWidth = parseInt(getComputedStyle(this.axis.slidersArea)['width']);
                            that.slidersAreaLeft  = this.axis.slidersArea.offsetLeft;
                            that.slidersAreaRight = that.slidersAreaCalculationWidth + that.slidersAreaLeft;
                        }
                    }.bind(this),
                    limit: function (moveX, that) {
                        return this._sliderCommonLimitJudge('slider',moveX, that, this._sliderJudgeCallback);
                    }.bind(this)
                });
            }
        },
        _sliderJudgeCallback: function (moveX, that) {
            if (that.slidersAreaLeft > that.previous.pointX && that.slidersAreaRight > that.previous.pointX) {
                if (moveX > that.slidersAreaRight) {
                    this.axis.slidersArea.style.left  = that.slidersAreaRight + 'px';
                    this.axis.slidersArea.style.width = moveX - that.slidersAreaRight + this.options.slider.width/2 + 'px';
                } else {
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + that.previous.pointX - moveX + 'px';
                    this.axis.slidersArea.style.left  = moveX + this.options.slider.width/2 + 'px';
                }
            }
            if (that.slidersAreaRight > that.previous.pointX && that.previous.pointX > that.slidersAreaLeft) {
                if (moveX < that.slidersAreaLeft) {
                    this.axis.slidersArea.style.width = that.slidersAreaLeft - moveX - this.options.slider.width/2 + 'px';
                    this.axis.slidersArea.style.left  = moveX + this.options.slider.width/2 + 'px';
                } else {
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + moveX - that.previous.pointX + 'px';
                    this.axis.slidersArea.style.left  = that.slidersAreaLeft  + 'px';
                }
            }
            //todo data
            this._sliderJudgeData(moveX,that);
        },
        _sliderJudgeData:function (moveX,that) {
            var pointGroup = Timeline.jointArrayGroup(this.axis.recordPoint);
            for (var i = 0; i < pointGroup.length; i += 1) {
                if (pointGroup[i][0] < moveX && moveX < pointGroup[i][1]) {
                    var pointValue = '';
                    pointValue = this.axis.recordData[pointGroup[i][0]];
                    if(moveX > that.lastPointX){
                        pointValue = this.axis.recordData[pointGroup[i][1]];
                    }
                    if(moveX === that.limitLeft){
                        pointValue = this.axis.recordData[pointGroup[0][0]];
                    }
                    that.slidersTips.innerHTML = pointValue;
                    this.drag(pointValue);
                }
            }
            if(typeof pointValue !== 'undefined'){
                this.dataTime[0] = pointValue;
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
                borderTop: {
                    name: 'border-top',
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
            var sectionArea = this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
            for (var i = 0; i < sectionArea; i += 1) {
                var stylesTicks = this._axisTicksTemplateStyle(i);
                axisTicks += '<div style="' + stylesTicks.ticks + '"><div style="' + stylesTicks.line + '"></div><div style="' + stylesTicks.text + '">' + sections[i] + '</div></div>' + fn(i, sectionArea) + '';
            }
            return axisTicks;
        },
        _axisTicksTemplateStyle: function (index) {
            var positions = this._axisTicksPosition();
            var axisTicksStyles = {
                position: 'absolute;',
                width: this.options.axisTicks.width + 'px;',
                left: positions[index] + 'px;',
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
                line: Timeline.generateStyle(axisTicksLineStyles),
                text: Timeline.generateStyle(axisTicksTextStyles)
            };
            return styles;
        },
        _axisTicksPosition: function () {
            var section = this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
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
                positions.push(MONTH * this._axisItemTicksWidth);
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
                line: Timeline.generateStyle(axisItemTicksLineStyles),
                text: Timeline.generateStyle(axisItemTicksTextStyles)
            };
            return styles;
        },
        _axisSectionOrder: function () {
            var sectionTotal = this.options.section[this.options.section.length - 1] - this.options.section[0];
            var sections = [];
            var index = 0;
            while (sectionTotal-- >= 0) {
                sections.push(this.options.section[0] + index++);
            }
            return sections;
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
        _axisRecord: function () {
            //year
            var sections = this._axisSectionOrder();
            var sectionsPoint = this._axisSectionPoint(sections);
            //month
            var month = this._axisMonthOrder();
            var monthPoint = this._axisMonthPoint(sections,month);
            //day
            var day = this._axisDayOrder();
            var dayPoint = this._axisDayPoint(monthPoint,day);
            //todo
            var axisRecord = {};
            for (var i = 0, l = sections.length; i < l; i += 1) {
                axisRecord[sections[i]] = sectionsPoint[i];
                this.axis.recordData[sectionsPoint[i] - this.options.slider.width/2] = sections[i].toString();
                this.axis.recordPoint.push(sectionsPoint[i] - this.options.slider.width/2);
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
                                this.axis.recordData[dayPoint[i][m][d] - this.options.slider.width/2 ] = sections[i] + '-' + month[m] + repairDay;
                                this.axis.recordPoint.push(dayPoint[i][m][d] - this.options.slider.width/2);
                            }
                        }
                    }
                }
            }
            return axisRecord;
        },
        _axisSectionPoint: function (sections) {
            var positions = [];
            for(var i = 0 ; i < sections.length; i += 1){
                var point = i * this.options.axisItemWidth + Math.ceil(this.options.axisTicks.width / 2);
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
                        var monthPoint = axisTicksPosition[i] + this.options.axisTicks.width + this._axisItemTicksWidth * j + Math.ceil(this._axisItemTicksWidth / 2);
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
                        var dayWidth = parseFloat((this._axisItemTicksWidth/days).toFixed(2));
                        var dayWidthHalf = parseFloat((dayWidth/2).toFixed(2));
                        var dayPoint = monthPoint[i][m] + dayWidth * d + dayWidthHalf;
                        dayAllPoint.push(dayPoint);
                    }
                    daySplitPoint.push(dayAllPoint);
                }
                axisDayPoint.push(daySplitPoint);
            }
            return axisDayPoint;
        }
    };
    Timeline.Drag = function (element, options) {
        if (!(this instanceof Timeline.Drag)) {
            return new Timeline.Drag(element, options);
        }
        this.elements = {
            element: element,
            pointX: 0,
            pointY: 0,
            previous: {
                pointX: 0,
                y: 0
            },
            flag: false
        };
        this.options = {
            limit: null,
            start: null,
            end: null
        };
        for (var k in options) {
            this.options[k] = options[k];
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
            this.elements.element.addEventListener('mousedown', this, false)
        },
        _dragStartExecute: function (event) {
            event.cancelBubble = true;
            event.stopPropagation();
            event.target.setCapture && event.target.setCapture();
            this.elements.flag = true;
            this.elements.pointX = event.clientX - this.elements.element.offsetLeft;
            if (this.options.start !== null && typeof this.options.start === 'function') this.options.start(this.elements);
            return false;
        },
        _dragMove: function () {
            doc.addEventListener('mousemove', this, false);
        },
        _dragMoveExecute: function (event) {
            if (!this.elements.flag)return false;
            var moveX = event.clientX - this.elements.pointX;
            var pointMoveX = this.options.limit !== null && typeof this.options.limit === 'function' ? this.options.limit(moveX, this.elements) : moveX;
            this.elements.element['style']['left'] = pointMoveX + 'px';
            return false;
        },
        _dragEnd: function () {
            doc.addEventListener('mouseup', this, false);
            try {
                this.elements.element.addEventListener('losecapture', this, false);
            } catch (e) {
                console.warn('element is null or error!')
            }
        },
        _dragEndExecute: function (event) {
            event.cancelBubble = true;
            event.stopPropagation();
            var moveX = event.clientX - this.elements.pointX;
            this.elements.flag = false;
            this.elements.element.releaseCapture && this.elements.element.releaseCapture();
            this.elements.previous.pointX = moveX;
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
    Timeline.isObject = function () {
        var arg = [].slice.call(arguments)[0];
        return Object.prototype.toString.call(arg) === '[object Object]';
    };
    Timeline.copy(timeLine.prototype, TimelineMethods);
    return Timeline();
}));