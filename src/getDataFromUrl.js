export function getDataFromUrl(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url);
        xhr.send();

        xhr.addEventListener('load', function () {
            if (xhr.status === 200) {
                var obj = JSON.parse(xhr.response);
                resolve(obj);
            } else {
                reject(new Error('Ошибка получения данных по персонажам'));
            }
        });
    });
}