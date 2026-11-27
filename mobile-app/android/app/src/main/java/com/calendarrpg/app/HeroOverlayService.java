package com.calendarrpg.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Canvas;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * 화면 위 용사: '다른 앱 위에 표시' 권한으로 화면 아래쪽(내비게이션 바 위)에 투명한 띠를 띄우고
 * 그 위에서 용사가 슬라임과 싸운다. PC 작업표시줄 전투와 같은 방식(고양이 키우기 앱 방식).
 * 터치는 아래 앱으로 그대로 통과한다.
 */
public class HeroOverlayService extends Service {
    static final String ACTION_STOP = "com.calendarrpg.app.OVERLAY_STOP";
    /** 켜 두기 원함 ("1"/"0") — Capacitor Preferences 와 같은 저장소라 문자열로 저장 */
    static final String PREF_ON = "overlay_on";
    private static final String CHANNEL = "hero_overlay";
    private static final int NOTI_ID = 4242;
    static volatile HeroOverlayService instance;

    private WindowManager wm;
    private OverlayView view;
    private BroadcastReceiver screenReceiver;

    static boolean canDraw(Context c) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(c);
    }

    static boolean isRunning() {
        return instance != null && instance.view != null;
    }

    static void start(Context c) {
        Store.prefs(c).edit().putString(PREF_ON, "1").apply();
        ContextCompat.startForegroundService(c, new Intent(c, HeroOverlayService.class));
    }

    static void stop(Context c) {
        Store.prefs(c).edit().putString(PREF_ON, "0").apply();
        c.stopService(new Intent(c, HeroOverlayService.class));
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            Store.prefs(this).edit().putString(PREF_ON, "0").apply();
            stopSelf();
            return START_NOT_STICKY;
        }
        startForegroundNow();
        if (!canDraw(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (view == null) addOverlay();
        return START_STICKY;
    }

    private void startForegroundNow() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.overlay_channel), NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        PendingIntent stop = PendingIntent.getService(this, 5001,
                new Intent(this, HeroOverlayService.class).setAction(ACTION_STOP),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_quest)
                .setContentTitle(getString(R.string.overlay_title))
                .setContentText(getString(R.string.overlay_text))
                .setOngoing(true)
                .setSilent(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(WidgetUpdater.openApp(this, 5000))
                .addAction(0, getString(R.string.overlay_hide), stop)
                .build();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTI_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTI_ID, n);
        }
    }

    private void addOverlay() {
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        view = new OverlayView(this);
        float d = getResources().getDisplayMetrics().density;
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                (int) (140 * d),
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.BOTTOM | Gravity.START;
        lp.y = navBarHeight();
        // 안드로이드 12부터는 창 불투명도가 0.8 이하여야 터치가 아래 앱으로 통과한다
        lp.alpha = 0.8f;
        try {
            wm.addView(view, lp);
        } catch (RuntimeException e) {
            view = null;
            stopSelf();
            return;
        }
        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                if (view == null) return;
                if (Intent.ACTION_SCREEN_OFF.equals(i.getAction())) view.pause();
                else view.resume();
            }
        };
        IntentFilter f = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        f.addAction(Intent.ACTION_SCREEN_ON);
        ContextCompat.registerReceiver(this, screenReceiver, f, ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    private int navBarHeight() {
        int id = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        return id > 0 ? getResources().getDimensionPixelSize(id) : 0;
    }

    /** 앱에서 임무 보상 → 머리 위 연출 */
    void reward(int xp, int gold, String rarity) {
        OverlayView v = view;
        if (v != null) v.post(() -> v.scene.reward(xp, gold, rarity));
    }

    /** 장비·레벨이 바뀌었을 때 */
    void reload() {
        OverlayView v = view;
        if (v != null) v.post(v.scene::reloadState);
    }

    @Override
    public void onDestroy() {
        if (view != null && wm != null) {
            try {
                wm.removeView(view);
            } catch (RuntimeException ignored) {
                // 이미 사라짐
            }
        }
        view = null;
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (RuntimeException ignored) {
                // 무시
            }
            screenReceiver = null;
        }
        instance = null;
        super.onDestroy();
    }

    /** 투명한 띠에 장면을 1초에 20번 그린다. 화면이 꺼지면 멈춘다. */
    static final class OverlayView extends View {
        final WallpaperScene scene;
        private long last;
        private boolean running = true;

        OverlayView(Context c) {
            super(c);
            scene = new WallpaperScene(c, true);
            scene.reloadState();
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            scene.resize(w, h, getResources().getDisplayMetrics().density);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            long now = SystemClock.uptimeMillis();
            float dt = last == 0 ? 0 : Math.min(0.08f, (now - last) / 1000f);
            last = now;
            scene.step(dt);
            scene.draw(canvas);
            if (running) postInvalidateDelayed(50);
        }

        void pause() {
            running = false;
        }

        void resume() {
            if (running) return;
            running = true;
            last = 0;
            scene.reloadState();
            invalidate();
        }
    }
}
