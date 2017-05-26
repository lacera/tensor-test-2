import * as createElement from './microComponents';
import $ from 'jquery';

/**
 * Конструктор объекта DOM-компонента Модифицируемого списка, для дальнейшей установки в DOM
 * @param groupedData {object} объект, содержащий сгруппированные данные
 * и маркеры, в частности, маркер для определения выделяемых слов
 * @this {ListDOMComponent}
 * @constructor
 */
export function ListDOMComponent(groupedData) {
    // если сгруппированные данные (маркеры не учитываем) true, то поднимаем компонент списка
    if (groupedData.data) {
        var mainUl = createElement.MainUl();

        this._listTree = createElement.MainDiv();
        this._listTree.append(mainUl);

        groupedData.data.forEach((group) => {
            var MainLi = createElement.MainLi(group.groupLabel);

            mainUl.append(MainLi);

            group.groupItems.forEach((groupItem) => {
                var enclosedLiText = '';

                for (let key in groupItem) {
                    if (groupedData.markers.target === key) {
                        enclosedLiText += '<b>' + keySymbolUnderline(groupItem[key]) + '</b>' + ' ';
                    } else {
                        enclosedLiText += groupItem[key] + ' ';
                    }
                }

                MainLi.append(createElement.EnclosedLi(enclosedLiText.trim()));
            });
        });
    } else {
        // если пришли false-данные для списка, то запишем в главное свойство компонента заглушку
        this._listTree = createElement.BadListStub();
    }

    // функция для возврата строки с подчеркнутым ключевым символом (символ, по которому производится группировка)
    function keySymbolUnderline(keyString) {
        if (groupedData.markers.keyIndex == 1) {
            return '<u>' + keyString[0] + '</u>' + keyString.slice(1)
        }

        if (groupedData.markers.keyIndex > 1 && groupedData.markers.keyIndex <= keyString.length) {
            return keyString
                        .slice(0, groupedData.markers.keyIndex - 1)
                        .concat(
                            '<u>' + keyString[groupedData.markers.keyIndex - 1] + '</u>',
                            keyString.slice(groupedData.markers.keyIndex)
                        );
        }

        return keyString;
    }
}

// вернуть готовое дерево компонента списка для вставки в DOM
ListDOMComponent.prototype.getListTree = function () {
    return this._listTree[0];
};
// вставка дерева компонента списка в DOM элемент, переданный по id
ListDOMComponent.prototype.insertToDOM = function (id) {
    document.querySelector(id).appendChild(this.getListTree());
};
// установка скроллирования компонента
ListDOMComponent.prototype.setSrolling = function (scrollTriggers) {
    var rootElement = $('html'),
        mainDiv = this._listTree,
        mainUl = mainDiv.find('.main-ul'),
        scrollStart = false,
        lastMouseY = null;

    if (scrollTriggers.includes('pressedMouseButton')) {
        mainDiv.mousedown(scrollingMouseDownHandler);
        mainDiv.mousemove(scrollingMouseMoveHandler);
        // чтобы scroll отпускался в любом месте окна браузера и за его пределами, вешаем mouseup на rootElement
        rootElement.mouseup(scrollingMouseUpHandler);
    }

    function scrollingMouseDownHandler() {
        scrollStart = true;
        lastMouseY = null;
    }

    function scrollingMouseUpHandler() {
        scrollStart = false;
        lastMouseY = null;
    }

    function scrollingMouseMoveHandler(e) {
        if (scrollStart) {
            var currentMouseY = e.pageY;
            // вычисляем модификатор скролла (вверх или вниз пытаемся крутить список)
            if (lastMouseY === null) {
                lastMouseY = currentMouseY;
            }

            var scrollModifier = lastMouseY - currentMouseY;
            lastMouseY = currentMouseY;

            var ulTopChange = mainUl.offset().top - scrollModifier,
                divUlHeightDifference = mainDiv.offset().top + mainDiv.innerHeight() - mainUl.innerHeight();

            // математика прокрутки списка вверх-вниз
            if ((ulTopChange >= divUlHeightDifference) && (ulTopChange <= mainDiv.offset().top)) {
                changeMainUlTop(scrollModifier);
            } else if (ulTopChange < divUlHeightDifference) {
                changeMainUlTop(divUlHeightDifference);
            } else if (ulTopChange > mainDiv.offset().top) {
                changeMainUlTop(mainDiv.offset().top);
            }
        }

        function changeMainUlTop(modifier) {
            mainUl.offset({
                top: (modifier == scrollModifier)
                    ? mainUl.offset().top - modifier
                    : modifier
            });
        }
    }
};
// установка плавающего заголовка компонента
ListDOMComponent.prototype.setFloatingHeader = function () {
    var mainDiv = this._listTree,
        mainUl = mainDiv.find('.main-ul'),
        enclosedUlHeader = mainUl.find('.enclosed-ul__header'),
        nextHeader = null,
        floatingHeader = createElement.FloatingHeader();

    // вешаем плавающий заголовок над списком
    mainDiv.prepend(floatingHeader);

    mainDiv.mousemove(floatingHeaderMouseMoveHandler);

    function floatingHeaderMouseMoveHandler() {
        // назначение модификатора уплывшим наверх заголовкам
        enclosedUlHeader.each(function(index, el) {
            if ($(el).offset().top < mainDiv.offset().top) {
                $(el).addClass('enclosed-ul__header_floating');
                floatingHeader.text($(el).text());
            } else {
                $(el).removeClass('enclosed-ul__header_floating');
            }
        });

        // поиск следующего хэдера - сиблинга (от следующего родителя) после "плавающего"
        nextHeader = mainUl
            .find('.' + 'enclosed-ul__header_floating' + ':last')
            .parent()
            .next()
            .children('.enclosed-ul__header');
        // математика плавающего прозрачного заголовка
        if (nextHeader.offset() && ((nextHeader.offset().top - nextHeader.innerHeight()) <= mainDiv.offset().top)) {
            floatingHeader.offset({
                top: (nextHeader.offset().top - nextHeader.innerHeight())
            });
        } else {
            floatingHeader.offset(mainDiv.offset());
        }
    }
};
// установка стиля компонента
ListDOMComponent.prototype.setStyle = function (options) {
    // применение таких опций, как размеры и цветовая гамма
};