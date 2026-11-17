import { Router } from 'express';
import { readId, readPost } from './input.js';
import { createPost, listPosts, findPost,
    updatePost, deletePost, duplicatePost, replacePost,
    updatePostTitle, deleteAllPosts } from './posts.service.js';

export const router = Router();
router.param('id', (req, res, next, value) => {
    req.postId = readId(value);
    next();
});

router.post('/', async (req, res) => {
    const input = readPost(req.body);
    const post = await createPost(input);
    res.status(201).location(`/api/posts/${post.id}`).json(post);
});

router.get('/', async (req, res) => {
    res.json(await listPosts());
});

router.get('/:id', async (req, res) => {
    res.json(await findPost(req.postId));
});

router.patch('/:id', async (req, res) => {
    const input = readPost(req.body, true);
    res.json(await updatePost(req.postId, input));
});

router.delete('/:id', async (req, res) => {
    await deletePost(req.postId);
    res.status(204).end();
});


router.post('/:id/duplicate', async (req, res) => {
    const post = await duplicatePost(req.postId);
    res.status(201)
        .location(`/api/posts/${post.id}`)
        .json(post);
});

router.put('/:id', async (req, res) => {
    const input = readPost(req.body);
    const post = await replacePost(req.postId, input);
    res.status(200).json(post);
});

router.put('/:id/title', async (req, res) => {
    const input = readPost({
        title: req.body?.title,
        content: 'temporary'
    });
    const post = await updatePostTitle(
        req.postId, input.title
    );
    res.status(200).json(post);
});

router.delete('/', async (req, res) => {
    await deleteAllPosts();
    res.status(204).end();
});
