package com.calendarrpg.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

/** 홈 화면 위젯 전부 다시 그리기 */
final class WidgetUpdater {
    private WidgetUpdater() {}

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (int id : m.getAppWidgetIds(new ComponentName(c, QuestWidgetProvider.class))) {
            m.updateAppWidget(id, QuestWidgetProvider.build(c, id));
        }
        for (int id : m.getAppWidgetIds(new ComponentName(c, HeroWidgetProvider.class))) {
            m.updateAppWidget(id, HeroWidgetProvider.build(c, id));
        }
    }

    /** 앱 열기 */
    static PendingIntent openApp(Context c, int requestCode) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
