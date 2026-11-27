package com.calendarrpg.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * 앱(웹)과 위젯·배경화면이 함께 쓰는 저장소.
 * Capacitor Preferences 플러그인이 쓰는 SharedPreferences("CapacitorStorage")를 그대로 읽고 쓴다.
 */
final class Store {
    static final String PREFS = "CapacitorStorage";
    static final String SNAPSHOT = "widget_snapshot";
    static final String PENDING = "widget_pending";

    private Store() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** 앱이 남긴 위젯용 요약 (앱을 한 번도 안 열었으면 null) */
    static JSONObject snapshot(Context c) {
        String s = prefs(c).getString(SNAPSHOT, null);
        if (s == null) return null;
        try {
            return new JSONObject(s);
        } catch (JSONException e) {
            return null;
        }
    }

    static void saveSnapshot(Context c, JSONObject o) {
        prefs(c).edit().putString(SNAPSHOT, o.toString()).apply();
    }

    /** 위젯에서 체크했지만 아직 앱이 처리하지 않은 목록 */
    static JSONArray pending(Context c) {
        String s = prefs(c).getString(PENDING, null);
        if (s == null) return new JSONArray();
        try {
            return new JSONArray(s);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    static void savePending(Context c, JSONArray a) {
        prefs(c).edit().putString(PENDING, a.toString()).apply();
    }
}
