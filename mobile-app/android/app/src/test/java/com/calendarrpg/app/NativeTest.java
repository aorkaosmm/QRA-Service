package com.calendarrpg.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.test.core.app.ApplicationProvider;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

import java.io.File;
import java.io.FileOutputStream;

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
}
