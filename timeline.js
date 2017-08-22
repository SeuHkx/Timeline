/**
 * Created by hkx on 2017/7/4.
 */
;!(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return factory.apply(window);
        })
    }
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory.call(window);
    } else {
        window.Timeline = factory.call(window, document);
    }
}(typeof global === 'object' ? global : window, function (doc) {
    'use strict';
    var Timeline = function () {
        if (!(this instanceof Timeline)) {
            return new Timeline();
        }
        this.version = '1.0.0';
        this.github = 'http://github.com/SeuHkx';
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
                show: true,
                position: 'center' || 'bottom',
                height: 6,
                bgColor: 'rgba(51, 55, 64, 0.5)'
            },
            slider: {
                show: true,
                template: '<div class="timeline-slide"><div class="slide-tips">${location}</div><div class="slide"></div></div>',
                location: ['2012-02', '2013'],
                width: 14
            },
            axisType: 'order' || 'average',
            axisStyle: {
                bgColor: 'transparent',
                bdColor: '#bfbfbf',
                bdStyle: 'solid',
                color: '#fff'
            },
            axisTicks: {
                width: 100,
                fontSize: 14,
                color: '#bfbfbf',
            },
            axisTicksLineStyle: {
                height: 28,
                width: 1,
                bgColor: '#bfbfbf'
            },
            axisItemWidth: 640,
            axisItemTicksStyle: {
                fontSize: 12,
                height: 16,
                width: 1,
                bgColor: '#cfcfcf',
                color: '#cfcfcf'
            },
            axisItemTicksWidth: null
        };
        Timeline.extends(this.options, options);
        this.axis = {
            renderTo: doc.getElementById(this.options.renderTo),
            element: null,
            sliders: null,
            width:this._axisTemplateWidth(),
            slidersArea:null,
            slidersAreaCalculationWidth:0,
            recordPoint: [],
            recordData: {}
        };
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
        this.setOption = function (option) {
            this.axis.renderTo.removeChild(this.axis.element);
            Timeline.extends(this.options, option);
            if (this.options.axisType === 'order') {
                this.axis.width   = this._axisTemplateWidth();
                this.axis.element = Timeline.parseDom(this._axisTemplate(this.axis.width, true))[0];
                this._render();
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
            var renderToWidth = parseInt(getComputedStyle(this.axis.renderTo)['width']);
            var section = this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
            this.options.axisTicks.width = this.options.axisItemWidth = renderToWidth / section;
            this.axis.element = Timeline.parseDom(this._axisTemplate(renderToWidth, false))[0];
        },
        _render: function () {
            var styles = {
                position: 'relative',
                overflow: 'hidden',
                width: '100%'
            };
            this._renderToStyle(styles);
            if (this.options.slider.show) this._slider();
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
            this.axis.slidersArea  = this._slidersArea();
            Timeline.Drag(this.axis.slidersArea, {
                start: function (that) {
                    that.previous.pointX  = that.element.offsetLeft;
                    this.axis.slidersAreaCalculationWidth = parseInt(getComputedStyle(this.axis.slidersArea)['width']);
                }.bind(this),
                limit: function (moveX, that) {
                    return this._sliderCommonLimitJudge(moveX,that,this._slidersAreaJudgeCallback);
                }.bind(this)
            });
        },
        _slidersAreaJudgeCallback:function (moveX,that) {
            var distance = 0;
            if(that.previous.pointX < moveX){
                distance = moveX - that.previous.pointX;
                this.axis.sliders[1].style.left = parseInt(getComputedStyle(this.axis.sliders[1])['left']) + distance + 'px';
            }
            if(that.previous.pointX > moveX){
                distance = that.previous.pointX - moveX;
                this.axis.sliders[1].style.left = parseInt(getComputedStyle(this.axis.sliders[1])['left']) - distance + 'px';
            }
            that.previous.pointX  = moveX;
            this.axis.sliders[0].style.left = moveX + 'px';
        },
        _sliderCommonLimitJudge:function (moveX,that,callback) {
            var limitLeft  = this.options.axisTicks.width / 2;
            var limitRight = this.axis.width - this.options.axisTicks.width / 2 - this.axis.slidersAreaCalculationWidth;
            moveX = moveX < limitLeft  ? limitLeft  : moveX;
            moveX = moveX > limitRight ? limitRight : moveX;
            callback.call(this,moveX,that);
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
            var axisRecords = this._axisRecord();
            if (this.options.slidersArea.position === 'bottom') {
                positionTop = 0;
            }
            if (this.options.slider.location.length > 1) {
                this.axis.slidersAreaCalculationWidth = axisRecords[this.options.slider.location[1]] - axisRecords[this.options.slider.location[0]];
            }
            var styles = {
                position: 'absolute',
                top: positionTop + 'px',
                width: this.axis.slidersAreaCalculationWidth + 'px',
                left: axisRecords[this.options.slider.location[0]] + 'px',
                right: 0,
                background: this.options.slidersArea.bgColor,
                height: this.options.slidersArea.height + 'px'
            };
            for (var style in styles) {
                sliderArea.style[style] = styles[style];
            }
        },
        _slider: function () {
            this.axis.sliders = this._sliderToArr(Timeline.parseDom(this._sliderCompileTemplate()));
            var axisRecord = this._axisRecord();
            if (this.options.slidersArea.show) {
                this._slidersAreaExecute();
            }

            for (var i = 0; i < this.axis.sliders.length; i += 1) {
                this.axis.sliders[i]['style']['left'] = axisRecord[this.options.slider.location[i]] + 'px';
                this.axis.sliders[i]['style']['width'] = this.options.slider.width + 'px';
                this.axis.element.appendChild(this.axis.sliders[i]);
                //drag
                Timeline.Drag(this.axis.sliders[i], {
                    start: function (that) {
                        that.slidersTips      = this._sliderScanTips(that.element.childNodes, []).pop();
                        that.previous.pointX  = this._sliderScanParent(that.slidersTips).offsetLeft;
                        that.slidersAreaCalculationWidth = parseInt(getComputedStyle(this.axis.slidersArea)['width']);
                        that.slidersAreaLeft  = this.axis.slidersArea.offsetLeft;
                        that.slidersAreaRight = that.slidersAreaCalculationWidth + that.slidersAreaLeft;
                        this.axis.slidersAreaCalculationWidth = 0;
                    }.bind(this),
                    limit: function (moveX, that) {
                        return this._sliderCommonLimitJudge(moveX,that,this._sliderJudgeCallback);
                    }.bind(this)
                });
            }
        },
        _sliderJudgeCallback:function (moveX,that) {
            if(that.slidersAreaLeft === that.previous.pointX){
                if(moveX > that.slidersAreaRight){
                    this.axis.slidersArea.style.left  = that.slidersAreaRight + 'px';
                    this.axis.slidersArea.style.width = moveX - that.slidersAreaRight + 'px';
                }else{
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + that.previous.pointX - moveX + 'px';
                    this.axis.slidersArea.style.left  = moveX + 'px';
                }
            }
            if(that.slidersAreaRight === that.previous.pointX){
                if(moveX < that.slidersAreaLeft){
                    this.axis.slidersArea.style.width = that.slidersAreaLeft - moveX + 'px';
                    this.axis.slidersArea.style.left  = moveX + 'px';
                }else{
                    this.axis.slidersArea.style.width = that.slidersAreaCalculationWidth + moveX - that.previous.pointX + 'px';
                    this.axis.slidersArea.style.left  = that.slidersAreaLeft + 'px';
                }
            }
            // var pointArr = Timeline.jointArrayGroup(this.axis.recordPoint);
            // for (var ii = 0; ii < pointArr.length; ii += 1) {
            //     if (pointArr[ii][0] < moveX && moveX <= pointArr[ii][1]) {
            //         var pointValue = this.axis.recordData[pointArr[ii][0]];
            //         that.slidersTips.innerHTML = pointValue;
            //         this.drag(pointValue);
            //     }
            // }
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
        _sliderScanParent: function (node) {
            if (node.parentNode != this.axis.element) {
                this._sliderScanParent(node.parentNode);
            } else {
                return node.parentNode;
            }
            return node.parentNode;
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
                top: '50%;',
                left: '0;',
                right: '0;',
                bottom: '0;',
                width: width + 'px;',
                background: this.options.axisStyle.bgColor + ';',
                transition: 'all 1s cubic-bezier(0.1, 0.57, 0.1, 1);',
                cursor: 'move;',
                borderTop: {
                    name: 'border-top',
                    value: '1px ' + this.options.axisStyle.bdStyle + ' ' + this.options.axisStyle.bdColor + ';'
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
            this.options.axisItemTicksWidth = (this.options.axisItemWidth - this.options.axisTicks.width) / MONTH;
            while (MONTH-- > 0) {
                positions.push(MONTH * this.options.axisItemTicksWidth);
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
            var MONTH = 12;
            for (var i = 1; i <= MONTH; i += 1) {
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
            var MONTH = 12;
            //todo
            var axisDayOrder = {};
            for (var i = 0; i < axisSectionOrder.length; i += 1) {
                axisDayOrder[axisSectionOrder[i]] = [];
                for (var ii = 1; ii <= MONTH; ii += 1) {
                    var day = new Date(axisSectionOrder[i], ii, 0);
                    axisDayOrder[axisSectionOrder[i]].push(day.getDate());
                }
            }
            return axisDayOrder;
        },
        _axisRecord: function () {
            var sections = this._axisSectionOrder();
            var sectionsPoint = this._axisSectionPoint();
            var month = this._axisMonthOrder();
            var monthPoint = this._axisMonthPoint();
            //todo
            var axisRecord = {};
            for (var i = 0, l = sections.length; i < l; i += 1) {
                axisRecord[sections[i]] = sectionsPoint[i];
                this.axis.recordData[sectionsPoint[i]] = sections[i];
                this.axis.recordPoint.push(sectionsPoint[i]);
                if (i !== (sections.length - 1)) {
                    for (var m = 0; m < month.length; m += 1) {
                        axisRecord[sections[i] + '-' + month[m]] = monthPoint[sections[i]][m];
                        this.axis.recordData[Math.ceil(monthPoint[sections[i]][m])] = sections[i] + '-' + month[m];
                        this.axis.recordPoint.push(Math.ceil(monthPoint[sections[i]][m]));
                    }
                }
            }
            return axisRecord;
        },
        _axisSectionPoint: function () {
            var sectionTotal = this.options.section[this.options.section.length - 1] - this.options.section[0] + 1;
            var positions = [];
            while (sectionTotal-- > 0) {
                positions.push(sectionTotal * this.options.axisItemWidth + Math.ceil(this.options.axisTicks.width / 2));
            }
            return positions.reverse();
        },
        _axisMonthPoint: function () {
            var axisTicksPosition = this._axisTicksPosition();
            var sections = this._axisSectionOrder();
            var month = this._axisMonthOrder();
            //todo
            var axisMonthPoint = {};
            for (var i = 0; i < sections.length; i += 1) {
                axisMonthPoint[sections[i]] = [];
                if (i !== (sections.length - 1)) {
                    for (var j = 0; j < month.length; j += 1) {
                        var monthPoint = axisTicksPosition[i] + this.options.axisTicks.width + this.options.axisItemTicksWidth * j + Math.ceil(this.options.axisItemTicksWidth / 2);
                        axisMonthPoint[sections[i]].push(monthPoint);
                    }
                }
            }
            return axisMonthPoint;
        },
        _axisDayPoint: function () {
            //todo
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
            var event = event || window.event;
            var moveX = event.clientX - this.elements.pointX;
            this.elements.flag = false;
            this.elements.element.releaseCapture && this.elements.element.releaseCapture();
            this.elements.previous.pointX = moveX;
            if (this.options.end !== null && typeof this.options.end === 'function') this.options.end(this.elements);
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