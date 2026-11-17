import express from 'express';
import { fileURLToPath } from 'node:url';
import { router } from './posts.routes.js';
import { HttpError } from './input.js';

const app = express();
app.use((req, res, next) => {
    const startTime = Date.now();
    console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
    res.on('finish', () => {
        const elapsed = Date.now() - startTime;
        console.log(`[RESPONSE] ${res.statusCode} - ${elapsed}ms`);
    });

    next();
});
app.use(express.json({ limit: '100kb' }));
app.use('/api/posts', router);

if (process.env.NODE_ENV !== 'production') {
    // 500 Internal Server Error 테스트
    app.get('/api/test/500', (req, res, next) => {
        next(new Error('500 오류 테스트'));
    });

    // 503 Service Unavailable 테스트
    app.get('/api/test/503', (req, res, next) => {
        next(new HttpError(503, '서비스 일시 중단 테스트'));
    });
}

// Vue 패키지의 브라우저 모듈을 로컬에서 제공합니다.
app.get('/vendor/vue.js', (req, res) => {
    res.sendFile(fileURLToPath(
        new URL('../node_modules/vue/dist/vue.esm-browser.prod.js', import.meta.url),
    ), { dotfiles: 'allow' });
});
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
app.use((req, res, next) => next(new HttpError(404, '경로를 찾을 수 없습니다.')));
app.use((err, req, res, next) => {
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599
        ? err.status : 500;
    if (status >= 500) console.error(err);
    const message = status >= 500 ? '서버 처리 중 오류가 발생했습니다.'
        : err.type === 'entity.parse.failed' ? '올바른 JSON이 필요합니다.' : err.message;
    res.status(status).json({ statusCode: status, message });
});
app.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
    console.log(`게시판: http://127.0.0.1:${process.env.PORT ?? 3000}`);
});
