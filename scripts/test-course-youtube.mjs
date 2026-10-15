import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseYouTubeId, normalizeCourseVideoProvider, getCourseVideoValidationError } from '../src/utils/courseVideo.js';
import { splitCourseForStorage } from '../src/utils/courseDataPrivacy.js';
import { createQuickLesson } from '../src/utils/courseQuickAdd.js';

test('accepts watch, short, embed, live, Shorts URLs and plain YouTube IDs', () => {
  const id = 'M7lc1UVf-VE';
  for (const source of [id, `https://www.youtube.com/watch?v=${id}&t=32`, `https://youtu.be/${id}?si=share`,
    `https://www.youtube.com/shorts/${id}`, `https://www.youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`]) {
    assert.equal(getCourseYouTubeId(source), id);
    assert.equal(getCourseVideoValidationError({ videoProvider: 'youtube', videoId: source }), '');
  }
});

test('rejects lookalike domains, channel and playlist links and invalid IDs', () => {
  for (const source of ['', 'not-an-id', 'javascript:alert(1)', 'https://youtube.com.example.org/watch?v=M7lc1UVf-VE',
    'https://www.youtube.com/playlist?list=PLexample', 'https://www.youtube.com/@channel']) {
    assert.equal(getCourseYouTubeId(source), '');
    assert.ok(getCourseVideoValidationError({ videoProvider: 'youtube', videoId: source }));
  }
});

test('preserves S3 and Bunny and recognizes existing YouTube links', () => {
  assert.equal(normalizeCourseVideoProvider('s3', 'https://storage.example/video.mp4'), 's3');
  assert.equal(normalizeCourseVideoProvider('bunny', 'stream-id'), 'bunny');
  assert.equal(normalizeCourseVideoProvider('youtube', 'M7lc1UVf-VE'), 'youtube');
  assert.equal(normalizeCourseVideoProvider('s3', 'https://youtu.be/M7lc1UVf-VE'), 'youtube');
});

test('quick-add persists YouTube and rejects invalid YouTube drafts', () => {
  const lesson = createQuickLesson({ title: 'YouTube lesson', videoProvider: 'youtube', videoId: 'https://youtu.be/M7lc1UVf-VE' }, () => 'youtube-lesson');
  assert.equal(lesson.videoProvider, 'youtube');
  assert.equal(lesson.id, 'youtube-lesson');
  assert.equal('bunnyStatus' in lesson, false);
  assert.equal(createQuickLesson({ title: 'Invalid', videoProvider: 'youtube', videoId: 'https://youtube.com/@channel' }), null);
});

test('paid YouTube links stay private and preview links preserve their provider', () => {
  const url = 'https://youtu.be/M7lc1UVf-VE';
  for (const preview of [false, true]) {
    const { publicCourse, privateCourse } = splitCourseForStorage('course', {
      isForSale: true,
      curriculum: [{ lessons: [{ id: 'youtube-lesson', title: 'Lesson', videoId: url, videoProvider: 'youtube', isFreePreview: preview }] }],
    });
    assert.equal(privateCourse.curriculum[0].lessons[0].videoProvider, 'youtube');
    assert.equal(privateCourse.curriculum[0].lessons[0].videoId, url);
    assert.equal(publicCourse.curriculum[0].lessons[0].videoId, preview ? url : undefined);
    assert.equal(publicCourse.curriculum[0].lessons[0].videoProvider, preview ? 'youtube' : undefined);
  }
});
