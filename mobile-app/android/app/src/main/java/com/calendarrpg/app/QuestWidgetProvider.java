package com.calendarrpg.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** 홈 화면 위젯: 오늘의 임무 (바로 체크) */
public class QuestWidgetProvider extends AppWidgetProvider {
    static final int ROWS = 4;
    static final int[] ROW = {R.id.wq_row0, R.id.wq_row1, R.id.wq_row2, R.id.wq_row3};
    static final int[] CHK = {R.id.wq_chk0, R.id.wq_chk1, R.id.wq_chk2, R.id.wq_chk3};
    static final int[] TITLE = {R.id.wq_title0, R.id.wq_title1, R.id.wq_title2, R.id.wq_title3};
    static final int[] TIME = {R.id.wq_time0, R.id.wq_time1, R.id.wq_time2, R.id.wq_time3};

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context, id));
    }

    static RemoteViews build(Context c, int widgetId) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quests);
        v.setOnClickPendingIntent(R.id.wq_header, WidgetUpdater.openApp(c, 1000 + widgetId));
        JSONObject snap = Store.snapshot(c);
        if (snap == null) {
            v.setTextViewText(R.id.wq_date, "");
            v.setTextViewText(R.id.wq_progress, "");
            v.setProgressBar(R.id.wq_bar, 1, 0, false);
            for (int i = 0; i < ROWS; i++) v.setViewVisibility(ROW[i], View.GONE);
            v.setViewVisibility(R.id.wq_empty, View.VISIBLE);
            v.setTextViewText(R.id.wq_empty, "앱을 한 번 열면 오늘의 임무가 여기에 보여요");
            v.setOnClickPendingIntent(R.id.wq_empty, WidgetUpdater.openApp(c, 2000 + widgetId));
            v.setViewVisibility(R.id.wq_pending, View.GONE);
            return v;
        }
        int done = snap.optInt("done");
        int total = snap.optInt("total");
        v.setTextViewText(R.id.wq_date, snap.optString("dateLabel"));
        v.setTextViewText(R.id.wq_progress, done + " / " + total);
        v.setProgressBar(R.id.wq_bar, Math.max(1, total), done, false);

        JSONArray items = snap.optJSONArray("items");
        int n = items == null ? 0 : items.length();
        for (int i = 0; i < ROWS; i++) {
            if (i >= n) {
                v.setViewVisibility(ROW[i], View.GONE);
                continue;
            }
            JSONObject it = items.optJSONObject(i);
            boolean isDone = it.optBoolean("done");
            v.setViewVisibility(ROW[i], View.VISIBLE);
            v.setTextViewText(TITLE[i], it.optString("title"));
            v.setTextColor(TITLE[i], isDone ? Color.parseColor("#7d7796") : Color.parseColor("#ece9f5"));
            v.setTextViewText(TIME[i], it.optString("time"));
            v.setImageViewResource(CHK[i], isDone ? R.drawable.wchk_on : R.drawable.wchk_off);
            v.setOnClickPendingIntent(ROW[i], toggle(c, widgetId, i, it));
        }
        v.setViewVisibility(R.id.wq_empty, n == 0 ? View.VISIBLE : View.GONE);
        if (n == 0) {
            v.setTextViewText(R.id.wq_empty, "오늘 임무가 없어요 · 앱에서 추가해 보세요");
            v.setOnClickPendingIntent(R.id.wq_empty, WidgetUpdater.openApp(c, 2000 + widgetId));
        }

        int pending = Store.pending(c).length();
        v.setViewVisibility(R.id.wq_pending, pending > 0 ? View.VISIBLE : View.GONE);
        if (pending > 0) {
            v.setTextViewText(R.id.wq_pending, "보상 대기 " + pending + "개 · 앱을 열면 받아요");
            v.setOnClickPendingIntent(R.id.wq_pending, WidgetUpdater.openApp(c, 3000 + widgetId));
        }
        return v;
    }

    static PendingIntent toggle(Context c, int widgetId, int index, JSONObject it) {
        Intent i = new Intent(c, WidgetActionReceiver.class);
        i.setAction(WidgetActionReceiver.ACTION_TOGGLE);
        // 항목마다 다른 Intent 가 되도록 data 를 붙인다 (PendingIntent 재사용 방지)
        i.setData(Uri.parse("calendarrpg://toggle/" + widgetId + "/" + index + "/" + Uri.encode(it.optString("id")) + "/" + it.optString("day")));
        i.putExtra("k", it.optString("k"));
        i.putExtra("id", it.optString("id"));
        i.putExtra("day", it.optString("day"));
        return PendingIntent.getBroadcast(c, widgetId * 10 + index, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
