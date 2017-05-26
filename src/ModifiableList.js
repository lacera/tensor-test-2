import {ListDOMComponent} from './ListDOMComponent';

/**
 * Конструктор объекта т.н. Модифицируемого списка
 * @param data {object, Array} массив объектов - данные для списка
 * @param options {object} передаваемые настройки группировки, стиля
 * @this {ModifiableList}
 * @constructor
 */
export function ModifiableList(data, options) {
    // если данные верны, то запишем их в приватное свойство _data
    this._data = (data && data instanceof Array && data.length)
    ? data
    : null;

    // если опции верны, то запишем их в приватное свойство _options
    this._options = (options && typeof options === 'object')
    ? options
    : {};

    // создаем пустое приватное свойство сгруппированных данных
    this._groupedData = {
        data: [],
        markers: {}
    };

    this._notADataOptions = {};

    if (!this._data) {
        this._groupedData.data = this._data;
    } else {
        this.optionsAdaptation();
    }

    // создаем экземпляр списка в качестве DOM-компонента
    this.listDOMComponent = new ListDOMComponent(this._groupedData);
}

// вставляет готовый список в DOM-элемент с указанным id
ModifiableList.prototype.renderIn = function (id) {
    // вставляем готовый список
    this.listDOMComponent.insertToDOM(id);

    if (this._groupedData.data) {
        // применяем стили к списку
        this.listDOMComponent.setStyle(this._notADataOptions.style);
        // добавляем скроллирование списка
        this.listDOMComponent.setSrolling(this._notADataOptions.scroll);
        // устанавливаем плавающий заголовок
        if (this._notADataOptions.floatingHeader) {
            this.listDOMComponent.setFloatingHeader();
        }
    }
};
// Адаптация опций группировки и их использование (из переданных при конструировании Списка или по default'у)
ModifiableList.prototype.groupingOptionsAdaptation = function () {
    // задаем default-опции, если не переданы
    var groupingOptions = this._options.grouping || {};

    groupingOptions.dataType = groupingOptions.dataType || 'object';
    groupingOptions.type = groupingOptions.type || 'symbol[1]';

    // проверка корректности некоторых из переданных опций
    if (!propertiesValueValidation(
            groupingOptions, [
                {values: ['object', 'primitive'], inProp: 'dataType'}
            ])) {
        return;
    }

    // если группируемый тип данных - объекты (так передали в опциях или по default'у)
    if (groupingOptions.dataType === 'object') {
        // если таргет в опциях группировки не задан, то получаем в качестве таргета по умолчанию
        // ключ первого свойства первого объекта в массиве данных
        if (!Object.getOwnPropertyNames(this._data[0])[0]) {
            console.error('Группировка не будет произведена, т.к. ' +
                'для переданного в опциях типа данных "object" не найдено ключей свойств');
            return;
        }
        groupingOptions.target = groupingOptions.target || 'key[' + Object.getOwnPropertyNames(this._data[0])[0] +']';
        // если в опциях передан таргет-ключ - имя свойства объекта
        if (/key\[\w+\]/.test(groupingOptions.target)) {
            var objectKey = groupingOptions.target.replace(/key\[/, '').replace(/\]/, '');
            // записываем target-маркер для проброса в Component (в частности, что выделять жирным шрифтом)
            this._groupedData.markers.target = objectKey;
            // если в опциях группировки передан индекс ключевого символа группировки
            if (/symbol\[\d+\]/.test(groupingOptions.type)) {
                var keyIndex = Number.parseInt(/\d+/.exec(groupingOptions.type)[0]);
                // проверка соответствия индекса символа, по которому будет происходить группировка, длине данных
                if (!propertyValuesLengthValidation(this._data, objectKey, keyIndex)) {
                    console.warn('Внимание! Группировка может быть произведена некорректно ' +
                        '(или вовсе не будет произведена) из-за некорректного значения индексного ключа, ' +
                        'переданного в опциях.');
                }
                // записываем keyIndex-маркер для проброса в Component (выделять ключевой символ группировки)
                this._groupedData.markers.keyIndex = keyIndex;
            }

            // собираем массив сгруппированных данных
            this._data.forEach((itemData) => {
                if (!typeof itemData === groupingOptions.dataType || !itemData[objectKey]) {
                    console.error('Элемент данных ' + itemData + ' не будет участвовать в группировке, ' +
                        'т.к. его тип "' + (typeof itemData) + '" не соответствует переданному в опциях типу ' +
                        groupingOptions.dataType + ', или свойство с ключом ' + objectKey + ' (' +
                        itemData[objectKey] + ') принимает false-значение');
                    return;
                }

                if (this._groupedData.data.length === 0) {
                    itemToGroupedDataInsertion.call(this);
                } else {
                    var isInserted = false;
                    // добавление объекта в существующую группу сгруппированных данных
                    this._groupedData.data.forEach((itemGroupedData) => {
                        if (itemData[objectKey].charAt(keyIndex - 1) === itemGroupedData.groupLabel) {
                            itemGroupedData.groupItems.push(itemData);
                            isInserted = true;
                        }
                    });

                    if (!isInserted) {
                        itemToGroupedDataInsertion.call(this);
                    }
                }
                // добавление новой группы в сгруппированных данных
                function itemToGroupedDataInsertion() {
                    this._groupedData.data.push({
                        groupLabel: itemData[objectKey].charAt(keyIndex-1),
                        groupItems: [itemData]
                    });
                }
            });
        }
    }

    // если группируемый тип данных - примитивы (так передали в опциях)
    if (groupingOptions.dataType === 'primitive') {
        // группировка примитивов string, number, boolean, null, undefined в будущем
    }
};
// Адаптация опций сортировки и их использование (из переданных при конструировании Списка или по default'у)
ModifiableList.prototype.sortingOptionsAdaptation = function () {
    var directionModifier = 1,
        objectKey = this._groupedData.markers.target;
    // задаем default-опции, если не переданы
    var sortingOptions = this._options.sorting || {};
    sortingOptions.target = sortingOptions.target || 'all';
    sortingOptions.type = sortingOptions.type || 'symbol';
    sortingOptions.direction = sortingOptions.direction || 'increasing';

    if (sortingOptions.target === 'none') {
        return;
    }

    if (!propertiesValueValidation(
            sortingOptions, [
                {values: ['none', 'all', 'groups', 'items'], inProp: 'target'},
                {values: ['symbol', 'numeric'],              inProp: 'type'},
                {values: ['increasing', 'decreasing'],       inProp: 'direction'}
            ])) {
        return;
    }

    if (sortingOptions.direction === 'decreasing') {
        directionModifier = -1;
    }

    if (sortingOptions.target === 'all' || sortingOptions.target === 'groups') {
        sortArrayByObjectProperty(this._groupedData.data, 'groupLabel');
    }

    if (sortingOptions.target === 'all' || sortingOptions.target === 'items') {
        this._groupedData.data.forEach((item) => {
            sortArrayByObjectProperty(item.groupItems, objectKey);
        });
    }

    function sortArrayByObjectProperty(array, prop) {
        array.sort((a, b) => {
            if (sortingOptions.type === 'numeric') {
                return defineDirectionModifier(Number.parseFloat(a[prop]) > Number.parseFloat(b[prop]))
            }
            if (sortingOptions.type === 'symbol') {
                return defineDirectionModifier(a[prop].toString() > b[prop].toString())
            }
        });

        function defineDirectionModifier(expression) {
            return expression
                ? directionModifier
                : -1 * directionModifier
        }
    }
};
// Адаптация опций внешнего вида списка для дальнейшего их использования
ModifiableList.prototype.stylizeOptionsAdaptation = function () {
    // задаем default-опции, если не переданы
    var stylizeOptions = this._options.stylize || {};
    defineStylizeOptionByProperty('width', 200);
    defineStylizeOptionByProperty('height', 250);

    stylizeOptions.colorSpectrum = stylizeOptions.colorSpectrum || 'default';

    // проверка корректности некоторых из переданных опций
    propertiesValueValidation(
        stylizeOptions, [
            {values: ['default'], inProp: 'colorSpectrum'}
        ]);

    this._notADataOptions.style = stylizeOptions;

    // Принимаем переданные значения опций, если они целочисленные, иначе выставляем по умолчанию
    function defineStylizeOptionByProperty(prop, elseValue) {
        stylizeOptions[prop] = Number.isInteger(stylizeOptions[prop])
            ? stylizeOptions[prop]
            : elseValue;
    }
};
// Адаптация опции скроллирования списка для дальнейшего ее использования
ModifiableList.prototype.scrollOptionAdaptation = function () {
    var scrollOption = this._options.scroll;

    scrollOption = Array.isArray(scrollOption)
        ? scrollOption
        : ['pressedMouseButton'];

    // проверка корректности некоторых из переданных опций
    propertiesValueValidation(
        scrollOption, [
            {values: ['pressedMouseButton', 'wheel', 'arrowKeys'], inProp: 'scroll'}
        ]);

    this._notADataOptions.scroll = scrollOption;
};
// Адаптация опции плавающего над списком заголовка для дальнейшего ее использования
ModifiableList.prototype.floatingHeaderOptionAdaptation = function () {
    var floatingHeaderOption = this._options.floatingHeader;

    floatingHeaderOption = typeof floatingHeaderOption == 'boolean'
        ? floatingHeaderOption
        : true;

    this._notADataOptions.floatingHeader = floatingHeaderOption;
};
// Адаптация всех опций (из переданных при конструировании Списка или по default'у)
ModifiableList.prototype.optionsAdaptation = function () {

    this.groupingOptionsAdaptation();
    this.sortingOptionsAdaptation();
    this.stylizeOptionsAdaptation();
    this.scrollOptionAdaptation();
    this.floatingHeaderOptionAdaptation();

    console.log(this._options);
    console.log(this._groupedData);
};
// Метод для переопределения опций экземпляра Модифицируемого списка
ModifiableList.prototype.optionsOverride = function (options) {
    if (options && typeof options === 'object') {
        this._options = options;
    }
};

// проверка значений параметров опций на корректность
function propertiesValueValidation(obj, equals) {
    equals.forEach((equal) => {
        if (typeof obj[equal.inProp] == 'string' && !equal.values.includes(obj[equal.inProp])) {
            console.error('Значение "' + obj[equal.inProp] +
                '" параметра ' + equal.inProp + ' в опциях создания списка ' +
                'указано неправильно. Применение блока опций отклонено.');
            return false;
        }
        // если сам блок опций является массивом с примитивами
        if (Array.isArray(obj) && !obj.every((item) => equal.values.includes(item))) {
            console.error('Одно или несколько значений "' + obj +
                '" параметра ' + equal.inProp + ' в опциях создания списка ' +
                'недопустимы. Применение блока опций отклонено.');
            return false;
        }
    });

    return true;
}
// проверка соответствия длины значения свойства объекта данных переданному в опциях значению
function propertyValuesLengthValidation(data, objectKey, keyIndex) {
    if (keyIndex < 1) {
        console.error('Не допускается указание индексного ключа группировки меньше 1 (указано ' + keyIndex + ') ');
        return false;
    }

    return data.every((itemData) => {
        if (keyIndex > itemData[objectKey].length - 1) {
            console.error('Указанный индексный ключ группировки (' + keyIndex + ') выходит за пределы ' +
                'допустимой длины некоторых значений данных.');
            return false;
        }

        return true;
    });
}