package com.calendarrpg.app;

import android.app.WallpaperManager;
import android.appwidget.AppWidgetManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** 웹(앱 화면) → 네이티브: 위젯 갱신, 위젯 추가 요청, 라이브 배경화면 설정 화면 열기 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        WidgetUpdater.updateAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pinWidget(PluginCall call) {
        String kind = call.getString("kind", "quests");
        AppWidgetManager m = AppWidgetManager.getInstance(getContext());
        Class<?> cls = "hero".equals(kind) ? HeroWidgetProvider.class : QuestWidgetProvider.class;
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && m.isRequestPinAppWidgetSupported()) {
            ret.put("requested", m.requestPinAppWidget(new ComponentName(getContext(), cls), null, null));
        } else {
            ret.put("requested", false);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openWallpaperPicker(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Intent i = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
            i.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, new ComponentName(getContext(), HeroWallpaperService.class));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            ret.put("opened", true);
        } catch (ActivityNotFoundException e) {
            try {
                Intent i = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                ret.put("opened", true);
            } catch (ActivityNotFoundException e2) {
                ret.put("opened", false);
            }
        }
        call.resolve(ret);
    }
}
