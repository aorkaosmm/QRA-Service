package com.calendarrpg.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.test.core.app.ApplicationProvider;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.Shadows;
import org.robolectric.android.controller.ServiceController;
import org.robolectric.shadow.api.Shadow;
import org.robolectric.shadows.ShadowPendingIntent;
import org.robolectric.shadows.ShadowSettings;
import org.robolectric.shadows.ShadowSystemClock;
import org.robolectric.shadows.ShadowWindowManagerImpl;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

import java.io.File;
import java.io.FileOutputStream;
import java.time.Duration;
import java.util.Locale;

/** 위젯·배경화면 네이티브 코드 점검 (Robolectric 실제 그래픽 모드) */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 35)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class NativeTest {
    private Context ctx;
    private static final String SNAP = "{\"v\":1,\"today\":\"2026-11-27\",\"dateLabel\":\"11월 27일 (금)\",\"done\":1,\"total\":5,"
            + "\"items\":[{\"k\":\"daily\",\"id\":\"d1\",\"day\":\"2026-11-27\",\"title\":\"점심 식사\",\"time\":\"12:30\",\"done\":false},"
            + "{\"k\":\"task\",\"id\":\"t1\",\"day\":\"2026-11-27\",\"title\":\"분기 보고서 제출\",\"time\":\"\",\"done\":false},"
            + "{\"k\":\"daily\",\"id\":\"d2\",\"day\":\"2026-11-27\",\"title\":\"공부 1시간\",\"time\":\"\",\"done\":true}],"
            + "\"hero\":{\"name\":\"용사\",\"level\":7,\"xp\":120,\"xpNext\":300,\"hp\":80,\"maxHp\":140,\"gold\":512,\"slimes\":42},"
            + "\"gear\":{\"weapon\":\"legendary\",\"helmet\":\"rare\",\"armor\":\"epic\",\"cape\":\"legendary\"}}";

    @Before
    public void setUp() throws Exception {
        ctx = ApplicationProvider.getApplicationContext();
        Store.prefs(ctx).edit().clear().commit();
        Store.saveSnapshot(ctx, new JSONObject(SNAP));
    }

    private static void save(Bitmap b, String name) throws Exception {
        File dir = new File(System.getProperty("user.dir"), "build/test-out");
        dir.mkdirs();
        try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
            b.compress(Bitmap.CompressFormat.PNG, 100, out);
        }
    }

    @Test
    public void heroUsesGearColors() throws Exception {
        JSONObject gear = new JSONObject(SNAP).getJSONObject("gear");
        Bitmap b = PixelArt.hero(ctx, "idle0", gear, 8, false);
        assertEquals(32 * 8, b.getWidth());
        assertEquals(24 * 8, b.getHeight());
        save(b, "hero-legendary.png");
        Bitmap plain = PixelArt.hero(ctx, "idle0", new JSONObject("{\"weapon\":\"common\"}"), 8, false);
        save(plain, "hero-plain.png");
        // 장비가 다르면 그림이 달라야 한다
        assertTrue(!b.sameAs(plain));
        // 몸통(투구 없는 머리카락 자리)이 투명이 아닌지
        assertNotEquals(Color.TRANSPARENT, b.getPixel((8 + 7) * 8 + 4, (8 + 3) * 8 + 4));
    }

    @Test
    public void wallpaperDrawsScene() throws Exception {
        WallpaperScene s = new WallpaperScene(ctx);
        s.reloadState();
        s.resize(1080, 2400, 2.75f);
        for (int i = 0; i < 75; i++) s.step(1 / 30f);
        Bitmap out = Bitmap.createBitmap(1080, 2400, Bitmap.Config.ARGB_8888);
        s.draw(new Canvas(out));
        save(out, "wallpaper.png");
        // 하늘 위쪽은 어두운 색, 땅은 초록 줄
        int top = out.getPixel(10, 10);
        assertTrue(Color.red(top) < 60 && Color.blue(top) < 90);
    }

    @Test
    public void widgetCheckQueuesPendingAndFlipsItem() throws Exception {
        Intent i = new Intent(ctx, WidgetActionReceiver.class).setAction(WidgetActionReceiver.ACTION_TOGGLE)
                .putExtra("k", "daily").putExtra("id", "d1").putExtra("day", "2026-11-27");
        new WidgetActionReceiver().onReceive(ctx, i);
        JSONObject snap = Store.snapshot(ctx);
        assertTrue(snap.getJSONArray("items").getJSONObject(0).getBoolean("done"));
        assertEquals(2, snap.getInt("done"));
        JSONArray pending = Store.pending(ctx);
        assertEquals(1, pending.length());
        assertTrue(pending.getJSONObject(0).getBoolean("done"));
        // 다시 누르면 해제 + 대기 목록은 1건 유지(마지막 상태)
        new WidgetActionReceiver().onReceive(ctx, i);
        assertEquals(1, Store.pending(ctx).length());
        assertTrue(!Store.pending(ctx).getJSONObject(0).getBoolean("done"));
        assertEquals(1, Store.snapshot(ctx).getInt("done"));
    }

    @Test
    public void questWidgetInflatesWithItems() {
        FrameLayout parent = new FrameLayout(ctx);
        View v = QuestWidgetProvider.build(ctx, 7).apply(ctx, parent);
        assertEquals("점심 식사", ((TextView) v.findViewById(R.id.wq_title0)).getText().toString());
        assertEquals("11월 27일 (금)", ((TextView) v.findViewById(R.id.wq_date)).getText().toString());
        assertEquals("1 / 5", ((TextView) v.findViewById(R.id.wq_progress)).getText().toString());
        assertEquals(View.GONE, v.findViewById(R.id.wq_row3).getVisibility());
    }

    @Test
    public void heroWidgetInflates() {
        FrameLayout parent = new FrameLayout(ctx);
        View v = HeroWidgetProvider.build(ctx, 3).apply(ctx, parent);
        assertEquals("용사  Lv.7", ((TextView) v.findViewById(R.id.wh_name)).getText().toString());
        assertNotNull(v.findViewById(R.id.wh_f0));
    }

    @Test
    public void widgetsWorkBeforeFirstAppLaunch() {
        Store.prefs(ctx).edit().clear().commit();
        FrameLayout parent = new FrameLayout(ctx);
        View v = QuestWidgetProvider.build(ctx, 1).apply(ctx, parent);
        assertEquals(View.VISIBLE, v.findViewById(R.id.wq_empty).getVisibility());
        View h = HeroWidgetProvider.build(ctx, 1).apply(ctx, parent);
        assertNotNull(h);
    }

    @Test
    public void heroWidgetPlaysBattleLoop() throws Exception {
        JSONObject gear = new JSONObject(SNAP).getJSONObject("gear");
        Bitmap[] frames = BattleLoop.frames(ctx, gear, 6, "blue");
        assertEquals(BattleLoop.FRAMES, frames.length);
        assertFalse("공격 장면은 첫 장과 달라야 함", frames[0].sameAs(frames[3]));
        assertFalse("슬라임이 터진 장면은 달라야 함", frames[8].sameAs(frames[9]));
        // 한 장으로 이어 붙여 저장 (눈으로 확인용)
        int w = frames[0].getWidth();
        int h = frames[0].getHeight();
        Bitmap sheet = Bitmap.createBitmap(w * 6, h * 2, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(sheet);
        cv.drawColor(Color.parseColor("#191626"));
        for (int i = 0; i < frames.length; i++) cv.drawBitmap(frames[i], (i % 6) * w, (i / 6) * h, null);
        save(sheet, "widget-battle-loop.png");
    }

    @Test
    public void overlayStripIsTransparentWithReward() throws Exception {
        WallpaperScene s = new WallpaperScene(ctx, true);
        s.reloadState();
        s.resize(1080, 385, 2.75f);
        for (int i = 0; i < 70; i++) s.step(1 / 30f);
        s.reward(20, 8, "legendary");
        for (int i = 0; i < 8; i++) s.step(1 / 30f);
        Bitmap out = Bitmap.createBitmap(1080, 385, Bitmap.Config.ARGB_8888);
        s.draw(new Canvas(out));
        assertEquals("배경은 투명", 0, Color.alpha(out.getPixel(2, 2)));
        int painted = 0;
        for (int y = 0; y < out.getHeight(); y += 3) for (int x = 0; x < out.getWidth(); x += 3) if (Color.alpha(out.getPixel(x, y)) > 0) painted++;
        assertTrue("용사·슬라임이 그려져야 함", painted > 200);
        save(out, "overlay-strip.png");
    }

    @Test
    public void overlayServiceRunsWithPermission() {
        ShadowSettings.setCanDrawOverlays(true);
        ServiceController<HeroOverlayService> sc = Robolectric.buildService(HeroOverlayService.class).create().startCommand(0, 1);
        assertTrue(HeroOverlayService.isRunning());
        assertNotNull(Shadows.shadowOf(sc.get()).getLastForegroundNotification());
        sc.get().reward(10, 4, "rare");
        sc.destroy();
        assertFalse(HeroOverlayService.isRunning());
    }

    @Test
    public void overlayServiceRefusesWithoutPermission() {
        ShadowSettings.setCanDrawOverlays(false);
        ServiceController<HeroOverlayService> sc = Robolectric.buildService(HeroOverlayService.class).create().startCommand(0, 1);
        assertFalse(HeroOverlayService.isRunning());
        sc.destroy();
    }

    // ── 화면 위 용사: 다른 앱 위에 뜨는 창 ───────────────────────────────

    private static ServiceController<HeroOverlayService> startOverlay() {
        ShadowSettings.setCanDrawOverlays(true);
        return Robolectric.buildService(HeroOverlayService.class).create().startCommand(0, 1);
    }

    private static void idle(long ms) {
        Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(ms));
    }

    /** 창 관리자가 아직 배치하지 않았으면 창 설정 크기대로 직접 배치 */
    private static void layOut(View v, WindowManager.LayoutParams lp) {
        if (v.getWidth() > 0) return;
        int w = v.getResources().getDisplayMetrics().widthPixels;
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(lp.height, View.MeasureSpec.EXACTLY));
        v.layout(0, 0, w, lp.height);
    }

    private static Bitmap frame(View v) {
        Bitmap b = Bitmap.createBitmap(v.getWidth(), v.getHeight(), Bitmap.Config.ARGB_8888);
        v.draw(new Canvas(b));
        return b;
    }

    @Test
    @Config(qualifiers = "w360dp-h800dp-xxhdpi")
    public void overlayWindowFloatsAboveOtherAppsAndLetsTouchesThrough() {
        ServiceController<HeroOverlayService> sc = startOverlay();
        HeroOverlayService svc = sc.get();
        WindowManager.LayoutParams lp = svc.params;
        assertNotNull(lp);
        assertEquals("다른 앱 위에 뜨는 창", WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, lp.type);
        assertTrue("터치는 아래 앱으로 통과", (lp.flags & WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE) != 0);
        assertTrue("키보드·포커스를 빼앗지 않음", (lp.flags & WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE) != 0);
        assertTrue("안드로이드 12+ 터치 통과 조건: 불투명도 0.8 이하", lp.alpha <= 0.8f);
        assertEquals("배경 투명", PixelFormat.TRANSLUCENT, lp.format);
        assertEquals(Gravity.BOTTOM, lp.gravity & Gravity.VERTICAL_GRAVITY_MASK);
        assertEquals(ViewGroup.LayoutParams.MATCH_PARENT, lp.width);
        assertEquals("140dp 띠 (xxhdpi = 420px)", 420, lp.height);
        int nav = ctx.getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        assertTrue(nav > 0);
        assertEquals("내비게이션 바 바로 위", ctx.getResources().getDimensionPixelSize(nav), lp.y);
        assertTrue(lp.y > 0);
        View v = svc.view;
        ShadowWindowManagerImpl wm = Shadow.extract(svc.getSystemService(Context.WINDOW_SERVICE));
        assertTrue("창이 실제로 붙음", wm.getViews().contains(v));
        sc.destroy();
        assertFalse("서비스가 끝나면 창도 사라짐", wm.getViews().contains(v));
        assertFalse(HeroOverlayService.isRunning());
    }

    @Test
    public void overlayKeepsAnimatingAndRestsWhenScreenOff() {
        ServiceController<HeroOverlayService> sc = startOverlay();
        HeroOverlayService svc = sc.get();
        idle(100);
        HeroOverlayService.OverlayView v = svc.view;
        layOut(v, svc.params);
        Bitmap first = frame(v);
        for (int i = 0; i < 30; i++) {
            ShadowSystemClock.advanceBy(Duration.ofMillis(50));
            frame(v);
        }
        assertFalse("1.5초 뒤 장면이 달라야 함(전투 진행)", first.sameAs(frame(v)));
        assertTrue(v.isAnimating());
        ctx.sendBroadcast(new Intent(Intent.ACTION_SCREEN_OFF));
        idle(0);
        assertFalse("화면이 꺼지면 그리기를 멈춤(배터리 절약)", v.isAnimating());
        ctx.sendBroadcast(new Intent(Intent.ACTION_SCREEN_ON));
        idle(0);
        assertTrue("화면이 켜지면 다시 움직임", v.isAnimating());
        sc.destroy();
    }

    @Test
    public void overlayShowsRewardFromApp() {
        ServiceController<HeroOverlayService> sc = startOverlay();
        HeroOverlayService svc = sc.get();
        idle(100);
        layOut(svc.view, svc.params);
        int before = svc.view.scene.textCount();
        svc.reward(20, 8, "legendary");
        idle(0);
        assertTrue("임무 보상 글자가 용사 머리 위에 떠야 함", svc.view.scene.textCount() > before);
        sc.destroy();
    }

    @Test
    public void overlayNotificationHideButtonTurnsItOff() {
        ShadowSettings.setCanDrawOverlays(true);
        HeroOverlayService.start(ctx);
        assertEquals("1", Store.prefs(ctx).getString(HeroOverlayService.PREF_ON, null));
        Intent started = Shadows.shadowOf((Application) ctx).getNextStartedService();
        assertNotNull("포그라운드 서비스 시작 요청", started);
        assertEquals(HeroOverlayService.class.getName(), started.getComponent().getClassName());

        ServiceController<HeroOverlayService> sc = Robolectric.buildService(HeroOverlayService.class, started).create().startCommand(0, 1);
        HeroOverlayService svc = sc.get();
        Notification n = Shadows.shadowOf(svc).getLastForegroundNotification();
        assertNotNull("상태 표시줄 알림", n);
        assertTrue("밀어서 지워지지 않는 진행 중 알림", (n.flags & Notification.FLAG_ONGOING_EVENT) != 0);
        NotificationChannel ch = svc.getSystemService(NotificationManager.class).getNotificationChannel(n.getChannelId());
        assertNotNull(ch);
        assertEquals("소리 없는 조용한 알림", NotificationManager.IMPORTANCE_LOW, ch.getImportance());
        assertEquals(1, n.actions.length);
        assertEquals(ctx.getString(R.string.overlay_hide), n.actions[0].title.toString());
        ShadowPendingIntent pi = Shadows.shadowOf(n.actions[0].actionIntent);
        assertTrue(pi.isServiceIntent());
        Intent hide = pi.getSavedIntent();
        assertEquals(HeroOverlayService.ACTION_STOP, hide.getAction());

        sc.withIntent(hide).startCommand(0, 2);
        assertTrue("[숨기기] → 서비스 스스로 종료", Shadows.shadowOf(svc).isStoppedBySelf());
        assertEquals("앱을 다시 열어도 저절로 켜지지 않음", "0", Store.prefs(ctx).getString(HeroOverlayService.PREF_ON, null));
        sc.destroy();
        assertFalse(HeroOverlayService.isRunning());

        // 앱 설정의 [끄기]
        HeroOverlayService.stop(ctx);
        assertNotNull(Shadows.shadowOf((Application) ctx).getNextStoppedService());
    }

    /** 다른 앱(일반 목록 화면) 모양: 상태 표시줄, 상단 바, 카드 목록, 내비게이션 바 */
    private static Bitmap fakeApp(int w, int h, float d, int nav) {
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        c.drawColor(Color.parseColor("#f1f3f5"));
        float status = 28 * d;
        float bar = 56 * d;
        p.setColor(Color.parseColor("#3b5bdb"));
        c.drawRect(0, 0, w, status + bar, p);
        p.setColor(0xccffffff);
        c.drawRoundRect(new RectF(16 * d, 10 * d, 46 * d, 18 * d), 3 * d, 3 * d, p);
        c.drawRoundRect(new RectF(w - 40 * d, 10 * d, w - 16 * d, 18 * d), 3 * d, 3 * d, p);
        p.setColor(Color.WHITE);
        c.drawRoundRect(new RectF(16 * d, status + 19 * d, 140 * d, status + 37 * d), 6 * d, 6 * d, p);
        int[] accents = {0xffff8787, 0xff69db7c, 0xff74c0fc, 0xffffd43b, 0xffb197fc, 0xff63e6be};
        float y = status + bar + 12 * d;
        for (int i = 0; y < h - nav; i++, y += 96 * d) {
            p.setColor(Color.WHITE);
            c.drawRoundRect(new RectF(12 * d, y, w - 12 * d, y + 84 * d), 14 * d, 14 * d, p);
            p.setColor(accents[i % accents.length]);
            c.drawCircle(42 * d, y + 42 * d, 20 * d, p);
            p.setColor(0xff343a40);
            c.drawRoundRect(new RectF(74 * d, y + 22 * d, (150 + (i * 37) % 110) * d, y + 34 * d), 6 * d, 6 * d, p);
            p.setColor(0xffadb5bd);
            c.drawRoundRect(new RectF(74 * d, y + 46 * d, w - (40 + (i * 23) % 80) * d, y + 56 * d), 5 * d, 5 * d, p);
            p.setColor(0xffced4da);
            c.drawRoundRect(new RectF(74 * d, y + 62 * d, w - 96 * d, y + 70 * d), 4 * d, 4 * d, p);
        }
        p.setColor(Color.parseColor("#f8f9fa"));
        c.drawRect(0, h - nav, w, h, p);
        p.setColor(0xff495057);
        c.drawRoundRect(new RectF(w / 2f - 54 * d, h - nav / 2f - 2.5f * d, w / 2f + 54 * d, h - nav / 2f + 2.5f * d), 3 * d, 3 * d, p);
        return b;
    }

    /**
     * 다른 앱 화면 위에 용사 띠를 실제 창 설정(위치·불투명도)대로 겹쳐 본다.
     * OVERLAY_FRAMES 환경 변수가 있으면 장면들을 build/test-out/overlay-frames 에 저장(움짤 제작용).
     */
    @Test
    @Config(qualifiers = "w360dp-h800dp-xhdpi")
    public void overlayOverAnotherApp() throws Exception {
        ServiceController<HeroOverlayService> sc = startOverlay();
        HeroOverlayService svc = sc.get();
        idle(100);
        HeroOverlayService.OverlayView v = svc.view;
        WindowManager.LayoutParams lp = svc.params;
        layOut(v, lp);
        int w = ctx.getResources().getDisplayMetrics().widthPixels;
        int h = ctx.getResources().getDisplayMetrics().heightPixels;
        float d = ctx.getResources().getDisplayMetrics().density;
        Bitmap app = fakeApp(w, h, d, lp.y);
        int top = h - lp.y - lp.height;
        Paint win = new Paint();
        win.setAlpha(Math.round(lp.alpha * 255));
        boolean export = System.getenv("OVERLAY_FRAMES") != null;
        if (export) new File(System.getProperty("user.dir"), "build/test-out/overlay-frames").mkdirs();
        int frames = export ? 140 : 40;
        int rewardAt = export ? 70 : 25;
        Bitmap shot = null;
        for (int f = 0; f < frames; f++) {
            if (f == rewardAt) v.scene.reward(20, 8, "legendary");
            ShadowSystemClock.advanceBy(Duration.ofMillis(50));
            Bitmap strip = frame(v);
            shot = app.copy(Bitmap.Config.ARGB_8888, true);
            new Canvas(shot).drawBitmap(strip, 0, top, win);
            if (export) save(shot, String.format(Locale.ROOT, "overlay-frames/f%03d.png", f));
        }
        assertEquals("띠 위쪽 앱 화면은 그대로", app.getPixel(w / 2, top / 2), shot.getPixel(w / 2, top / 2));
        int changed = 0;
        for (int y = top; y < top + lp.height; y += 2) {
            for (int x = 0; x < w; x += 2) if (shot.getPixel(x, y) != app.getPixel(x, y)) changed++;
        }
        assertTrue("용사·슬라임이 앱 화면 위에 보여야 함", changed > 100);
        for (int x = 0; x < w; x += 4) assertEquals("내비게이션 바는 가리지 않음", app.getPixel(x, h - 2), shot.getPixel(x, h - 2));
        save(shot, "overlay-over-app.png");
        sc.destroy();
    }
}
