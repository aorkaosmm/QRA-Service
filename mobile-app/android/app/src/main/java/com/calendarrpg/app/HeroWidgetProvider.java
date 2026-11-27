package com.calendarrpg.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import org.json.JSONObject;

/** 홈 화면 위젯: 용사 (숨쉬는 2장 움직임 + 체력·경험치) */
public class HeroWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context, id));
    }

    static RemoteViews build(Context c, int widgetId) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_hero);
        v.setOnClickPendingIntent(R.id.wh_root, WidgetUpdater.openApp(c, 4000 + widgetId));
        JSONObject snap = Store.snapshot(c);
        JSONObject hero = snap == null ? null : snap.optJSONObject("hero");
        JSONObject gear = snap == null ? null : snap.optJSONObject("gear");
        if (gear == null) {
            gear = new JSONObject();
            try { gear.put("weapon", "common"); } catch (Exception ignored) { }
        }
        // 96dp × 72dp 칸에 딱 맞는 정수 배율로 그려 번지지 않게
        float density = c.getResources().getDisplayMetrics().density;
        int scale = Math.max(2, (int) Math.floor(96 * density / 32f));
        v.setImageViewBitmap(R.id.wh_f0, PixelArt.hero(c, "idle0", gear, scale, false));
        v.setImageViewBitmap(R.id.wh_f1, PixelArt.hero(c, "idle1", gear, scale, false));
        if (hero == null) {
            v.setTextViewText(R.id.wh_name, "용사 Lv.1");
            v.setProgressBar(R.id.wh_hp, 1, 1, false);
            v.setProgressBar(R.id.wh_xp, 1, 0, false);
            v.setTextViewText(R.id.wh_gold, "앱을 열어 모험을 시작하세요");
            return v;
        }
        v.setTextViewText(R.id.wh_name, hero.optString("name", "용사") + "  Lv." + hero.optInt("level", 1));
        v.setProgressBar(R.id.wh_hp, Math.max(1, hero.optInt("maxHp", 1)), hero.optInt("hp"), false);
        v.setProgressBar(R.id.wh_xp, Math.max(1, hero.optInt("xpNext", 1)), hero.optInt("xp"), false);
        v.setTextViewText(R.id.wh_gold, hero.optInt("gold") + "G · 슬라임 " + hero.optInt("slimes") + "마리");
        return v;
    }
}
