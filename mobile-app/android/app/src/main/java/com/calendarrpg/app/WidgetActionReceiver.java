package com.calendarrpg.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * 위젯에서 체크/해제 → 위젯 화면은 바로 바꾸고, 실제 처리(경험치·전리품)는 앱을 열 때 엔진이 한다.
 */
public class WidgetActionReceiver extends BroadcastReceiver {
    static final String ACTION_TOGGLE = "com.calendarrpg.app.TOGGLE";

    @Override
    public void onReceive(Context c, Intent intent) {
        if (!ACTION_TOGGLE.equals(intent.getAction())) return;
        String k = intent.getStringExtra("k");
        String id = intent.getStringExtra("id");
        String day = intent.getStringExtra("day");
        if (id == null || day == null) return;
        JSONObject snap = Store.snapshot(c);
        if (snap == null) return;
        try {
            JSONArray items = snap.optJSONArray("items");
            boolean target = true;
            if (items != null) {
                for (int i = 0; i < items.length(); i++) {
                    JSONObject it = items.getJSONObject(i);
                    if (id.equals(it.optString("id")) && day.equals(it.optString("day"))) {
                        target = !it.optBoolean("done");
                        it.put("done", target);
                        snap.put("done", Math.max(0, snap.optInt("done") + (target ? 1 : -1)));
                        break;
                    }
                }
            }
            Store.saveSnapshot(c, snap);

            JSONArray old = Store.pending(c);
            JSONArray next = new JSONArray();
            for (int i = 0; i < old.length(); i++) {
                JSONObject p = old.getJSONObject(i);
                if (!(id.equals(p.optString("id")) && day.equals(p.optString("day")))) next.put(p);
            }
            JSONObject p = new JSONObject();
            p.put("k", k == null ? "daily" : k);
            p.put("id", id);
            p.put("day", day);
            p.put("done", target);
            p.put("at", System.currentTimeMillis());
            next.put(p);
            Store.savePending(c, next);
        } catch (JSONException ignored) {
            // 잘못된 데이터는 무시
        }
        WidgetUpdater.updateAll(c);
    }
}
