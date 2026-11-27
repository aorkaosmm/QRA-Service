package com.calendarrpg.app;

import android.graphics.Canvas;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.service.wallpaper.WallpaperService;
import android.view.MotionEvent;
import android.view.SurfaceHolder;

/** 라이브 배경화면: 홈 화면이 보일 때만 그린다 (배터리 절약) */
public class HeroWallpaperService extends WallpaperService {
    @Override
    public Engine onCreateEngine() {
        return new HeroEngine();
    }

    private class HeroEngine extends Engine {
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final Runnable tick = this::frame;
        private WallpaperScene scene;
        private boolean visible;
        private long last;

        @Override
        public void onCreate(SurfaceHolder holder) {
            super.onCreate(holder);
            setTouchEventsEnabled(true);
            scene = new WallpaperScene(HeroWallpaperService.this);
            scene.reloadState();
        }

        @Override
        public void onVisibilityChanged(boolean v) {
            visible = v;
            handler.removeCallbacks(tick);
            if (v) {
                scene.reloadState();
                last = SystemClock.uptimeMillis();
                handler.post(tick);
            }
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            scene.resize(width, height, getResources().getDisplayMetrics().density);
            last = SystemClock.uptimeMillis();
            frame();
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            visible = false;
            handler.removeCallbacks(tick);
            super.onSurfaceDestroyed(holder);
        }

        @Override
        public void onDestroy() {
            handler.removeCallbacks(tick);
            super.onDestroy();
        }

        @Override
        public void onTouchEvent(MotionEvent event) {
            if (event.getAction() == MotionEvent.ACTION_UP) scene.tap(event.getX(), event.getY());
            super.onTouchEvent(event);
        }

        private void frame() {
            long now = SystemClock.uptimeMillis();
            float dt = Math.min(0.05f, (now - last) / 1000f);
            last = now;
            SurfaceHolder holder = getSurfaceHolder();
            Canvas c = null;
            try {
                c = holder.lockCanvas();
                if (c != null) {
                    scene.step(dt);
                    scene.draw(c);
                }
            } catch (IllegalStateException ignored) {
                // 화면이 사라지는 중
            } finally {
                if (c != null) {
                    try {
                        holder.unlockCanvasAndPost(c);
                    } catch (IllegalArgumentException | IllegalStateException ignored) {
                        // 무시
                    }
                }
            }
            if (visible) handler.postDelayed(tick, 33);
        }
    }
}
