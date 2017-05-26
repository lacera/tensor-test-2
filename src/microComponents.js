import $ from 'jquery';

function MainDiv() {
    return $('<div/>', { class: 'main-div' })
}

function MainUl() {
    return $('<ul/>', { class: 'main-ul' })
}

function MainLi(headerText) {
    return $('<li/>', { class: 'main-li' })
        .append($('<div/>', {
            class: 'enclosed-ul__header',
            text: headerText
        }))
        .append($('<ul/>', { class: 'enclosed-ul' }))
}

function EnclosedLi(html) {
    return $('<li/>', {
        class: 'enclosed-li',
        html:  html
    })
}

function FloatingHeader() {
    return $('<div/>', { class: 'main-ul__floating-header' })
}

function BadListStub() {
    return $('<div/>', {
        class: 'bad-data_style',
        text: 'Данные для списка не получены. Проверьте, правильно ли указан путь к данным, и попробуйте еще раз'
    })
}

export {
    MainDiv,
    MainUl,
    MainLi,
    EnclosedLi,
    FloatingHeader,
    BadListStub
}