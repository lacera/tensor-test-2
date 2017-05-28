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

    // объект для передачи в компонент с такими свойствами, как стилизация, скроллирование, плавающий заголовок
    this._notADataOptions = {};

    // адаптируем и применяем все опции
    this.optionsAdaptedApplying(this._options);
}

// вставляет готовый список в DOM-элемент с указанным id
ModifiableList.prototype.renderIn = function (id) {
    // если экземпляр компонента списка уже есть, - удаляем
    if (this._listDOMComponent) {
        this._listDOMComponent.deleteListTree();
    }
    // создаем экземпляр списка в качестве DOM-компонента
    this._listDOMComponent = new ListDOMComponent(this._groupedData);
    // вставляем готовый список
    this._listDOMComponent.insertToDOM(id);
    // если сгруппированные данные есть, то применяем прочие настройки
    if (this._groupedData.data) {
        // добавляем скроллирование списка
        this._listDOMComponent.setSrolling(this._notADataOptions.scroll);
        // устанавливаем плавающий заголовок
        if (this._notADataOptions.floatingHeader) {
            this._listDOMComponent.setFloatingHeader();
        }
        // применяем стили к списку
        this._listDOMComponent.setStyle(this._notADataOptions.style);
    }
};
/**
 * Метод, адаптирующий и применяющий опции группировки списка.
 * Вызывается сразу, по умолчанию, при конструировании Списка (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param groupingOptions {object}
 * пример: {dataType: 'object', target: 'key[firstName]', type: 'symbol[1]'}
 * по умолчанию параметр принимает значения {dataType: 'object', target: 'key[firstObjFirstPropName]', type: 'symbol[1]'},
 * где firstObjFirstPropName - первое собственное свойство первого объекта из массива данных
 *
 * возможные свойства для передачи в object-параметр:
 * dataType: 'object' || 'primitive',
 * target: 'key[propName]', где propName - свойство объекта, по которому будет произведена группировка,
 * || 'word[i]', где i - номер слова из строки
 * type: 'symbol[i]', где i - индекс символа (например, в значении свойства объекта, указанному в target),
 * по которому будет произведена группировка
 */
ModifiableList.prototype.groupingOptionsAdaptedApplying = function (groupingOptions) {
    // задаем default-опции, если не переданы
    groupingOptions = groupingOptions || {};
    groupingOptions.dataType = groupingOptions.dataType || 'object';
    groupingOptions.type = groupingOptions.type || 'symbol[1]';

    // создаем пустой приватный объект для сгруппированных данных
    newGroupingDataCreation.call(this);
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
            console.error('Группировка данных не будет произведена, т.к. ' +
                'для переданного в опциях типа данных "object" в данных не найдено ключей свойств');
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

    // если отдельно данным методом вызвано изменение опции, то перезаписываем изменение в _options
    if (groupingOptions != this._options.grouping) {
        this._options.grouping = groupingOptions;
    }
};
/**
 * Метод, адаптирующий и применяющий опции сортировки списка.
 * Вызывается сразу, по умолчанию, при конструировании Списка (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param sortingOptions {object},
 * пример: {target: 'all', type: 'symbol', direction: 'decreasing'}
 * по умолчанию параметр принимает значения {target: 'all', type: 'symbol', direction: 'increasing'}
 *
 * возможные свойства для передачи в object-параметр:
 * target: 'none' || 'all' || 'groups' || 'items',
 * type: 'symbol' || 'numeric',
 * direction: 'increasing' || 'decreasing'
 */
ModifiableList.prototype.sortingOptionsAdaptedApplying = function (sortingOptions) {
    if (!this._groupedData || !this._groupedData.markers || !this._groupedData.markers.target) {
        console.error('Невозможно определить ключ сортировки. Возможно, ранее возникли проблемы с ' +
            'группировкой данных или маркер сгруппированных данных теперь приведен к false-значению');
        return;
    }
    var directionModifier = 1,
        objectKey = this._groupedData.markers.target; // зависимость от свойства, определенного при группировке

    // задаем default-опции, если не переданы
    sortingOptions = sortingOptions || {};
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
                if (isNaN(Number.parseFloat(a[prop])) || isNaN(Number.parseFloat(b[prop]))) {
                    console.error('Числовая сортировка не будет произведена корректно, т.к. по крайней мере одно из ' +
                        'сравниваемых значений ("' + a[prop] + '" или "' + b[prop] + '") при приведении к числу ' +
                        'возвращает NaN');
                }
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

    // если отдельно данным методом вызвано изменение опции, то перезаписываем изменение в _options
    if (sortingOptions != this._options.sorting) {
        this._options.sorting = sortingOptions;
    }
};
/**
 * Метод, адаптирующий опции стилизации списка. Вызывается сразу, по умолчанию, при конструировании Списка
 (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param stylizeOptions {object},
 * пример: {colorSpectrum: 'green'}
 * по умолчанию параметр принимает значения {colorSpectrum: 'default'}
 *
 * возможные свойства для передачи в object-параметр:
 * colorSpectrum: 'default' || 'green' || 'red'
 */
ModifiableList.prototype.stylizeOptionsAdaptation = function (stylizeOptions) {
    // задаем default-опции, если не переданы
    stylizeOptions = stylizeOptions || {};
    stylizeOptions.colorSpectrum = stylizeOptions.colorSpectrum || 'default';

    // проверка корректности некоторых из переданных опций
    propertiesValueValidation(
        stylizeOptions, [
            {values: ['default', 'green', 'red'], inProp: 'colorSpectrum'}
        ]);

    this._notADataOptions.style = stylizeOptions;
    // если отдельно данным методом вызвано изменение опции, то записываем изменение в _options
    if (stylizeOptions != this._options.stylize) {
        this._options.stylize = stylizeOptions;
    }
};
/**
 * Метод, адаптирующий опцию скроллирования. Вызывается сразу, по умолчанию, при конструировании Списка
 (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param scrollOption {Array},
 * пример: ['wheel', 'pressedMouseButton']
 * по умолчанию параметр принимает значение ['pressedMouseButton']
 *
 * возможные значения для передачи в Array-параметр: 'wheel', 'pressedMouseButton', 'arrowKeys'
 */
ModifiableList.prototype.scrollOptionAdaptation = function (scrollOption) {
    scrollOption = Array.isArray(scrollOption)
        ? scrollOption
        : ['pressedMouseButton'];

    // проверка корректности некоторых из переданных опций
    propertiesValueValidation(
        scrollOption, [
            {values: ['pressedMouseButton', 'wheel', 'arrowKeys'], inProp: 'scroll'}
        ]);

    this._notADataOptions.scroll = scrollOption;
    // если отдельно данным методом вызвано изменение опции, то записываем изменение в _options
    if (scrollOption != this._options.scroll) {
        this._options.scroll = scrollOption;
    }
};
/**
 * Метод, адаптирующий опцию плавающего заголовка. Вызывается сразу, по умолчанию, при конструировании Списка
 (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param floatingHeaderOption {boolean},
 * пример: false
 * по умолчанию параметр принимает значение true
 *
 * возможные значения для передачи в boolean-параметр: true || false
 */
ModifiableList.prototype.floatingHeaderOptionAdaptation = function (floatingHeaderOption) {
    floatingHeaderOption = typeof floatingHeaderOption == 'boolean'
        ? floatingHeaderOption
        : true;

    this._notADataOptions.floatingHeader = floatingHeaderOption;
    // если отдельно данным методом вызвано изменение опции, то записываем изменение в _options
    if (floatingHeaderOption != this._options.floatingHeader) {
        this._options.floatingHeader = floatingHeaderOption;
    }
};
/**
 * Метод, адаптирующий и применяющий все опции. Вызывается сразу, по умолчанию, при конструировании Списка
 (из опций, переданных при конструировании Списка).
 * Может быть вызван отдельно с новыми опциями.
 * Перерисовка Списка в DOM с новыми опциями производится отдельно методом renderIn.
 *
 * @param options {object} такой же объект с такими же свойствами, что передается в качестве второго аргумента
 * при создании экземляра ModifiableList
 *
 * возможные свойства для передачи в object-параметр: grouping {object}, sorting {object}, stylize {object},
 * scroll {Array}, floatingHeader {boolean}
 */
ModifiableList.prototype.optionsAdaptedApplying = function (options) {
    options = options || {};

    // если пришли false-данные, то не адаптируем и не применяем опции
    if (!this._data) {
        // создаем пустой приватный объект для сгруппированных данных
        newGroupingDataCreation.call(this);
        this._groupedData.data = null;
        return;
    }

    this.groupingOptionsAdaptedApplying(options.grouping);
    this.sortingOptionsAdaptedApplying(options.sorting);
    this.stylizeOptionsAdaptation(options.stylize);
    this.scrollOptionAdaptation(options.scroll);
    this.floatingHeaderOptionAdaptation(options.floatingHeader);

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
// создание нового объекта сгруппированных данных
function newGroupingDataCreation() {
    if (this._groupedData) {
        delete this._groupedData;
    }
    this._groupedData = {
        data: [],
        markers: {}
    };
}