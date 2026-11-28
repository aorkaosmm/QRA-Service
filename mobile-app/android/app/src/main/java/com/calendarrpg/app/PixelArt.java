package com.calendarrpg.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 데스크톱과 같은 도트 그림(assets/sprites.json)을 비트맵으로 그린다.
 * 문자 격자 + 팔레트 → 정수 배율 비트맵 (번짐 없이 또렷하게).
 */
final class PixelArt {
    private static JSONObject data;
    private static final Map<String, Bitmap> cache = new HashMap<>();
    static final String[] SLOTS = {"helmet", "armor", "cape"};

    private PixelArt() {}

    static synchronized JSONObject data(Context c) {
        if (data != null) return data;
        try (InputStream in = c.getAssets().open("sprites.json")) {
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
            data = new JSONObject(new String(bos.toByteArray(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            data = new JSONObject();
        }
        return data;
    }

    static int color(String s) {
        if (s == null || s.isEmpty() || "null".equals(s)) return Color.TRANSPARENT;
        try {
            return Color.parseColor(s);
        } catch (IllegalArgumentException e) {
            return Color.TRANSPARENT;
        }
    }

    static Map<Character, Integer> palette(JSONObject p) {
        Map<Character, Integer> out = new HashMap<>();
        if (p == null) return out;
        Iterator<String> it = p.keys();
        while (it.hasNext()) {
            String k = it.next();
            out.put(k.charAt(0), p.isNull(k) ? Color.TRANSPARENT : color(p.optString(k)));
        }
        return out;
    }

    /** 문자 격자 → 비트맵 */
    static Bitmap render(JSONArray rows, Map<Character, Integer> pal, int scale, boolean flip) {
        int h = rows.length();
        int w = h > 0 ? rows.optString(0).length() : 1;
        Bitmap bmp = Bitmap.createBitmap(Math.max(1, w * scale), Math.max(1, h * scale), Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        Paint p = new Paint();
        p.setAntiAlias(false);
        for (int y = 0; y < h; y++) {
            String row = rows.optString(y);
            for (int x = 0; x < row.length(); x++) {
                char ch = row.charAt(x);
                if (ch == '.' || ch == ' ') continue;
                Integer col = pal.get(ch);
                if (col == null || Color.alpha(col) == 0) continue;
                p.setColor(col);
                int dx = flip ? (w - 1 - x) : x;
                cv.drawRect(dx * scale, y * scale, (dx + 1) * scale, (y + 1) * scale, p);
            }
        }
        return bmp;
    }

    static String gearSig(JSONObject gear) {
        if (gear == null) return "----";
        StringBuilder sb = new StringBuilder();
        for (String s : new String[]{"weapon", "helmet", "armor", "cape"}) {
            String r = gear.isNull(s) ? "" : gear.optString(s, "");
            sb.append(r.isEmpty() ? '-' : r.charAt(0));
        }
        return sb.toString();
    }

    /** 장비 등급을 반영한 용사 팔레트 */
    static Map<Character, Integer> heroPalette(Context c, JSONObject gear) {
        JSONObject hero = data(c).optJSONObject("hero");
        Map<Character, Integer> pal = palette(hero == null ? null : hero.optJSONObject("base"));
        JSONObject parts = hero == null ? null : hero.optJSONObject("parts");
        if (parts == null) return pal;
        for (String slot : SLOTS) {
            String r = gear == null || gear.isNull(slot) ? null : gear.optString(slot, null);
            if (r == null) continue;
            JSONObject bySlot = parts.optJSONObject(slot);
            if (bySlot != null) pal.putAll(palette(bySlot.optJSONObject(r)));
        }
        String w = gear == null || gear.isNull("weapon") ? null : gear.optString("weapon", null);
        JSONObject weapons = parts.optJSONObject("weapon");
        if (w != null && weapons != null && weapons.optJSONObject(w) != null) {
            pal.putAll(palette(weapons.optJSONObject(w)));
        } else {
            for (char k : new char[]{'1', '2', '3', '4', '5', '6'}) pal.put(k, Color.TRANSPARENT);
        }
        return pal;
    }

    /** 장착한 무기 종류 (sword · bow · gun · staff). 예전 요약에는 없어서 검 */
    static String weaponType(JSONObject gear) {
        String wt = gear == null || gear.isNull("weaponType") ? "sword" : gear.optString("weaponType", "sword");
        return wt.isEmpty() ? "sword" : wt;
    }

    static synchronized Bitmap hero(Context c, String pose, JSONObject gear, int scale, boolean flip) {
        String wt = weaponType(gear);
        String key = "h|" + pose + "|" + gearSig(gear) + "|" + wt + "|" + scale + "|" + flip;
        Bitmap b = cache.get(key);
        if (b != null) return b;
        JSONObject hero = data(c).optJSONObject("hero");
        JSONObject byWeapon = hero == null ? null : hero.optJSONObject("posesByWeapon");
        JSONObject poses = byWeapon != null && byWeapon.optJSONObject(wt) != null
                ? byWeapon.optJSONObject(wt)
                : (hero == null ? null : hero.optJSONObject("poses"));
        JSONArray rows = poses == null ? null : poses.optJSONArray(pose);
        if (rows == null) rows = new JSONArray().put(".");
        b = render(rows, heroPalette(c, gear), scale, flip);
        trim();
        cache.put(key, b);
        return b;
    }

    static synchronized Bitmap slime(Context c, String frame, String color, int scale, boolean flip) {
        String key = "s|" + frame + "|" + color + "|" + scale + "|" + flip;
        Bitmap b = cache.get(key);
        if (b != null) return b;
        JSONObject slime = data(c).optJSONObject("slime");
        JSONArray rows = slime == null ? null : slime.optJSONObject("frames").optJSONArray(frame);
        JSONObject pal = slime == null ? null : slime.optJSONObject("colors").optJSONObject(color);
        if (rows == null) rows = new JSONArray().put(".");
        b = render(rows, palette(pal), scale, flip);
        trim();
        cache.put(key, b);
        return b;
    }

    static synchronized Bitmap coin(Context c, int frame, int scale) {
        String key = "c|" + frame + "|" + scale;
        Bitmap b = cache.get(key);
        if (b != null) return b;
        JSONObject coin = data(c).optJSONObject("coin");
        JSONArray rows = coin == null ? null : coin.optJSONArray("frames").optJSONArray(frame);
        if (rows == null) rows = new JSONArray().put(".");
        b = render(rows, palette(coin == null ? null : coin.optJSONObject("palette")), scale, false);
        cache.put(key, b);
        return b;
    }

    private static void trim() {
        if (cache.size() > 120) cache.clear();
    }

    /** 3×5 도트 숫자·영문 (외곽선 포함). (x, yBottom)은 글자 아래 가운데 */
    static void drawText(Context c, Canvas cv, String text, float x, float yBottom, int color, int px, int alpha) {
        JSONObject font = data(c).optJSONObject("font");
        if (font == null) return;
        String t = text.toUpperCase();
        int glyphW = 3 * px;
        int gap = px;
        float width = t.length() * (glyphW + gap) - gap;
        float left = x - width / 2f;
        float top = yBottom - 5 * px;
        Paint p = new Paint();
        p.setAntiAlias(false);
        int ink = Color.parseColor("#1a1423");
        int[][] outline = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}, {-1, -1}, {1, 1}, {-1, 1}, {1, -1}};
        for (int pass = 0; pass < 2; pass++) {
            p.setColor(pass == 0 ? ink : color);
            p.setAlpha(alpha);
            for (int i = 0; i < t.length(); i++) {
                JSONArray g = font.optJSONArray(String.valueOf(t.charAt(i)));
                if (g == null) continue;
                for (int gy = 0; gy < 5; gy++) {
                    String row = g.optString(gy);
                    for (int gx = 0; gx < 3 && gx < row.length(); gx++) {
                        if (row.charAt(gx) != '1') continue;
                        float bx = left + i * (glyphW + gap) + gx * px;
                        float by = top + gy * px;
                        if (pass == 0) {
                            for (int[] o : outline) cv.drawRect(bx + o[0] * px, by + o[1] * px, bx + o[0] * px + px, by + o[1] * px + px, p);
                        } else {
                            cv.drawRect(bx, by, bx + px, by + px, p);
                        }
                    }
                }
            }
        }
    }
}
