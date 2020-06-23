const {src, dest, parallel, series, watch} = require('gulp');
const browserSync   = require('browser-sync').create();
const concat        = require('gulp-concat'); //склейка файлов в один
const uglify        = require('gulp-uglify-es').default; //минификация js-файлов
const sass          = require('gulp-sass');
const autoprefixer  = require('gulp-autoprefixer');
const cleanCSS      = require('gulp-clean-css'); //минификация, сжатие, удаление комментариев из css
const imageMin      = require('gulp-imagemin'); //сжатие картинок
const newer         = require('gulp-newer'); // запускают таски только для изменившихся файлов
const del = require('del'); //удаление/очистка ненужных папок/файлов

function browserSyncFunc() {
    browserSync.init({
        server: {baseDir: 'assets/'}, // в какой папке следить за изменениями
        notify: false, //отключить уведомление в брайзере Browser connected
        online: true, //если false - то можно будет использовать без включенного интернета, только локальный адрес
    })
}

function scriptsFunc() {
    return src([
        'node_modules/jquery/dist/jquery.min.js', //обязательно должен идти первым до кастомных js файлов
        'assets/js/custom.js'
    ])
        .pipe(concat('scripts.min.js')) //scripts.min.js - это название файла, который выйдет после объединения всех вышеуказанных js файлов
        .pipe(uglify()) //минификация js-кода в файле scripts.min.js
        .pipe(dest('assets/js/')) //ложим файл scripts.min.js в указанный путь/папку
        .pipe(browserSync.stream())
}

function stylesFunc() {
    return src('assets/styles/sass/main.scss')
        .pipe(sass()) //минификация файла стилей
        .pipe(concat('styles.min.css')) //объединение всех файлов стилей в один под названием styles.min.css -> имя может быть любое
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true //для поддержки grid в IE
        }))
        .pipe(cleanCSS({
            level: { 1: {          //максимальный уровень сжатия -> стили в одну строку
                specialComments: 0 //убираем комментарии из файла стилей
            }}
        }))
        .pipe(dest('assets/styles/css/'))
        .pipe(browserSync.stream())
}

function imagesFunc() {
    return src('assets/images/src/**/*')
        .pipe(newer('assets/images/dist/')) //смотрим, если в данном пути уже есть оптимизированные изобр-я, то мы за ними не следим
        .pipe(imageMin())
        .pipe(dest('assets/images/dist/'))
}

function cleanImgFunc() {
    return del('assets/images/dist/**/*', {force: true})
}

function cleanBuildFunc() {
    return del('build/**/*', {force: true})
}

function buildCopyFunc() {
    return src([
        'assets/styles/css/**/*.min.css',
        'assets/js/**/*.min.js',
        'assets/images/dist/**/*',
        'assets/**/*.html'
    ], { base: 'assets'}) // base: 'assets' -> сохранить структуру папок как в assets при переносе файлов в build
        .pipe(dest('build'))
}

function startWatchFunc() {  //наблюдаем за источниками (assets), а не за build
    watch('assets/**/*.html').on('change', browserSync.reload); //следим за изменениями в html-файлах
    watch('assets/styles/sass/**/*', stylesFunc);
    watch(['assets/**/*.js', '!assets/**/*.min.js'], scriptsFunc) //следить за изменением всех файлов js, кроме минифицированного js ВАЖНО '!..' -> искючает файл из отслеживания, ! должен идти в самом конце перечисления
    watch('assets/images/src/**/*', imagesFunc);
}

exports.browserSyncTask     = browserSyncFunc; //made export of the function into task
exports.scriptsTask         = scriptsFunc; //экспортируем таск со скриптами
exports.stylesTask          = stylesFunc;
exports.imagesTask          = imagesFunc;
exports.cleanImgTask        = cleanImgFunc;

exports.default             = parallel(stylesFunc, scriptsFunc, browserSyncFunc, startWatchFunc);
exports.build               = series(cleanBuildFunc, stylesFunc, scriptsFunc, imagesFunc, buildCopyFunc);








