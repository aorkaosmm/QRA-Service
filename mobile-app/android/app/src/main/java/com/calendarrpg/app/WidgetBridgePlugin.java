package com.calendarrpg.app;

import android.app.WallpaperManager;
import android.appwidget.AppWidgetManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

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
        HeroOverlayService s = HeroOverlayService.instance;
        if (s != null) s.reload();
        call.resolve();
    }

    /** 화면 위 용사: 권한·실행 상태 */
    @PluginMethod
    public void overlayStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("permission", HeroOverlayService.canDraw(getContext()));
        r.put("running", HeroOverlayService.isRunning());
        r.put("wanted", "1".equals(Store.prefs(getContext()).getString(HeroOverlayService.PREF_ON, "0")));
        call.resolve(r);
    }

    /** '다른 앱 위에 표시' 허용 화면 열기 */
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        JSObject r = new JSObject();
        try {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            r.put("opened", true);
        } catch (ActivityNotFoundException e) {
            r.put("opened", false);
        }
        call.resolve(r);
    }

    @PluginMethod
    public void setOverlay(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        JSObject r = new JSObject();
        if (on && !HeroOverlayService.canDraw(getContext())) {
            r.put("running", false);
            r.put("permission", false);
            call.resolve(r);
            return;
        }
        if (on) HeroOverlayService.start(getContext());
        else HeroOverlayService.stop(getContext());
        r.put("running", on);
        r.put("permission", true);
        call.resolve(r);
    }

    /** 앱에서 임무 보상 → 화면 위 용사 머리 위 연출 */
    @PluginMethod
    public void notifyReward(PluginCall call) {
        HeroOverlayService s = HeroOverlayService.instance;
        if (s != null) s.reward(call.getInt("xp", 0), call.getInt("gold", 0), call.getString("rarity", null));
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
