import {getDataFromUrl} from './getDataFromUrl';
import {ModifiableList} from './ModifiableList';

import $ from 'jquery';

require('./css/main.ul.css');
require('./css/enclosed.ul.css');
require('./css/modifiable.list.css');

$(document).ready(function() {
    // создаем экземпляр Модифицируемого списка асинхронно, дождавшись получения данных с сервера
    getDataFromUrl("https://raw.githubusercontent.com/lacera/tensor_test/master/src/data.actors.json")
        .then(data => {
            // дождались данных, создаем
            var modifiableList1 = new ModifiableList(
                data, // данные из json
                {
                    grouping: { // опционально, не обязательно, т.к. есть default-группировка
                        dataType: 'object', // указываем, что типом группируемых данных в массиве будут объекты // primitive
                        target: 'key[firstName]', // группировка по указанному свойству объекта
                        type: 'symbol[1]'  // группировка по первому символу объекта
                    },
                    sorting: { // опционально, не обязательно, т.к. есть default-сортировка
                        target: 'all', // groups, items, none
                        type: 'symbol', // numeric
                        direction: 'decreasing' // increasing
                    },
                    // на будущее, если развивать библиотеку, можно представить и такой набор свойств:
                    stylize: { // опционально, не обязательно, т.к. есть default-стилизация
                        colorSpectrum: 'default' // red, green
                    },
                    scroll: ['pressedMouseButton'], //
                    floatingHeader: true
                }
            );

            // Вставка списка. Передаем id элемента, который будет принимать список
            modifiableList1.renderIn('#app-modifiable-list-1');
        })
        .catch(function(error) {
            // если данных не пришло - ошибка в лог
            console.log(error);
        });

    getDataFromUrl("https://raw.githubusercontent.com/lacera/tensor_test/master/src/data.characters.json")
        .then(data => {
            // дождались данных, создаем
            var modifiableList4 = new ModifiableList(
                data, // данные из json
                {
                    grouping: { // опционально, не обязательно, т.к. есть default-группировка
                        dataType: 'object', // указываем, что типом группируемых данных в массиве будут объекты // primitive
                        target: 'key[secondName]', // группировка по указанному свойству объекта
                        type: 'symbol[1]'  // группировка по первому символу объекта
                    },
                    sorting: { // опционально, не обязательно, т.к. есть default-сортировка
                        target: 'all', // groups, items, none
                        type: 'symbol', // numeric
                        direction: 'increasing' // increasing
                    },
                    // на будущее, если развивать библиотеку, можно представить и такой набор свойств:
                    stylize: { // опционально, не обязательно, т.к. есть default-стилизация
                        colorSpectrum: 'green' // red, green
                    },
                    scroll: ['pressedMouseButton'], //
                    floatingHeader: true
                }
            );

            // Вставка списка. Передаем id элемента, который будет принимать список
            modifiableList4.renderIn('#app-modifiable-list-4');
        })
        .catch(function(error) {
            // если данных не пришло - ошибка в лог
            console.log(error);
        });

    // создаем экземпляр Модифицируемого списка из данных, получения которых дожидаться не надо
    var modifiableList2 = new ModifiableList(
        [{
            hello: 'world',
            world: 'hello'
        },
        {
            hello: 'worm',
            world: 'hell'
        }], // данные из потока (уже есть, дожидаться не надо)
        {
            grouping: {
                dataType: 'object',
                target: 'key[hello]',
                type: 'symbol[1]'
            },
            sorting: {
                target: 'all',
                type: 'symbol',
                direction: 'increasing'
            },
            stylize: {
                colorSpectrum: 'green'
            },
            scroll: ['wheel', 'pressedMouseButton', 'arrowKeys'],
            floatingHeader: false
        }
    );

    // Вставка списка. Передаем id элемента, который будет принимать список
    modifiableList2.renderIn('#app-modifiable-list-2');

    // создаем экземпляр Модифицируемого списка с пустыми данными
    var modifiableList3 = new ModifiableList(
        null,
        {}
    );

    // Вставка списка. Передаем id элемента, который будет принимать список
    modifiableList3.renderIn('#app-modifiable-list-3');
});