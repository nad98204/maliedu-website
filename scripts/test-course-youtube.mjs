import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourseYouTubeId, getCourseYouTubeWatchUrl, normalizeCourseVideoProvider, normalizeYouTubePlaybackMode, getCourseVideoValidationError } from '../src/utils/courseVideo.js';
import { splitCourseForStorage } from '../src/utils/courseDataPrivacy.js';
import { createQuickLesson, mergeQuickLessonDrafts } from '../src/utils/courseQuickAdd.js';

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

test('external mode accepts only explicit opt-in and builds a trusted watch URL', () => {
  for (const mode of [undefined, null, '', 'EMBED', 'unknown']) {
    assert.equal(normalizeYouTubePlaybackMode(mode), 'embed');
  }
  assert.equal(normalizeYouTubePlaybackMode('external'), 'external');
  for (const source of ['M7lc1UVf-VE', 'https://youtu.be/M7lc1UVf-VE?si=share', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE']) {
    assert.equal(getCourseYouTubeWatchUrl(source), 'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  }
  for (const source of ['javascript:alert(1)', 'https://evil.test/watch?v=M7lc1UVf-VE', 'https://youtube.com/playlist?list=PLtest']) {
    assert.equal(getCourseYouTubeWatchUrl(source), '');
  }
});

test('quick-add and pending drafts preserve the external playback selection', () => {
  const lesson = createQuickLesson({ title: 'Mở ngoài', videoProvider: 'youtube', videoId: 'https://youtu.be/M7lc1UVf-VE', youtubePlaybackMode: 'external' });
  assert.equal(lesson.youtubePlaybackMode, 'external');
  assert.equal(createQuickLesson({ title: 'Cũ', videoProvider: 'youtube', videoId: 'M7lc1UVf-VE' }).youtubePlaybackMode, 'embed');
  const pending = mergeQuickLessonDrafts([{ lessons: [] }], [{ sectionIndex: 0, ...lesson }]);
  assert.equal(pending.curriculum[0].lessons[0].youtubePlaybackMode, 'external');
});

test('external mode survives private storage and preview projection without exposing paid URLs', () => {
  for (const preview of [false, true]) {
    const { publicCourse, privateCourse } = splitCourseForStorage('course', {
      isForSale: true,
      curriculum: [{ lessons: [{ id: 'lesson', videoId: 'https://youtu.be/M7lc1UVf-VE', videoProvider: 'youtube', youtubePlaybackMode: 'external', isFreePreview: preview }] }],
    });
    assert.equal(privateCourse.curriculum[0].lessons[0].youtubePlaybackMode, 'external');
    assert.equal(publicCourse.curriculum[0].lessons[0].youtubePlaybackMode, preview ? 'external' : undefined);
    assert.equal(publicCourse.curriculum[0].lessons[0].videoId, preview ? 'https://youtu.be/M7lc1UVf-VE' : undefined);
  }
});
