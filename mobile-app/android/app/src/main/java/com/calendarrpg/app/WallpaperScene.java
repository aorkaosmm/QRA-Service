package com.calendarrpg.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;

/**
 * 용사가 슬라임을 찾아가 싸우는 장면.
 * - 라이브 배경화면: 도트 밤하늘 + 땅 (overlay=false)
 * - 화면 위 용사(다른 앱 위에 표시): 배경 없이 투명한 띠, 띠 바닥이 땅 (overlay=true)
 * 단위는 '도트'(art px). 화면 픽셀 = 도트 × S.
 */
final class WallpaperScene {
    private static final String[] COLORS = {"green", "blue", "red", "purple", "gold"};
    private static final float GRAVITY = 520f;

    private final Context ctx;
    private final boolean overlay;
    private final Random rnd = new Random();
    private final Paint paint = new Paint();
    private int width = 1;
    private int height = 1;
    private int S = 4;
    private int W = 1;
    private int H = 1;
    private float ground = 1;
    private Bitmap bg;
    private int[] starX = new int[0];
    private int[] starY = new int[0];
    private float time;

    private JSONObject gear;
    private int level = 1;

    // 용사
    private float hx = -1;
    private float hy;
    private float hvy;
    private int hface = 1;
    private boolean attacking;
    private boolean hit;
    private float ht;
    private float anim;
    private float cooldown;

    // 슬라임
    private float sx;
    private float sy;
    private float svx;
    private float svy;
    private float flash;
    private float hop;
    private float dead;
    private int shp;
    private int sface = -1;
    private String scolor = "green";

    private static final class Text { float x, y, t; String s; int color; int size; }
    private static final class Part { float x, y, vx, vy, t; int color; }
    private final ArrayList<Text> texts = new ArrayList<>();
    private final ArrayList<Part> parts = new ArrayList<>();

    WallpaperScene(Context c) {
        this(c, false);
    }

    WallpaperScene(Context c, boolean overlay) {
        ctx = c;
        this.overlay = overlay;
        paint.setAntiAlias(false);
        paint.setFilterBitmap(false);
    }

    void resize(int w, int h, float density) {
        width = Math.max(1, w);
        height = Math.max(1, h);
        S = Math.max(3, Math.round(density * (overlay ? 2.2f : 2.6f)));
        W = (int) Math.ceil(width / (float) S);
        H = (int) Math.ceil(height / (float) S);
        // 배경화면은 화면 80% 높이가 땅, 화면 위 용사는 띠 맨 아래가 땅
        ground = overlay ? (float) Math.floor(height / (float) S) : Math.round(H * 0.80f);
        bg = null;
        int n = Math.max(30, W * H / 160);
        starX = new int[n];
        starY = new int[n];
        Random r = new Random(7);
        for (int i = 0; i < n; i++) {
            starX[i] = r.nextInt(Math.max(1, W));
            starY[i] = r.nextInt(Math.max(1, (int) (ground * 0.62f)));
        }
        if (hx < 0) {
            hx = W * 0.35f;
            spawn();
        }
        hx = clamp(hx, 10, W - 10);
    }

    void reloadState() {
        JSONObject snap = Store.snapshot(ctx);
        gear = snap == null ? null : snap.optJSONObject("gear");
        if (gear == null) {
            gear = new JSONObject();
            try { gear.put("weapon", "common"); } catch (Exception ignored) { }
        }
        JSONObject hero = snap == null ? null : snap.optJSONObject("hero");
        level = hero == null ? 1 : Math.max(1, hero.optInt("level", 1));
    }

    private void spawn() {
        boolean fromLeft = hx > W / 2f;
        sx = fromLeft ? -10 : W + 10;
        sy = 0;
        svx = 0;
        svy = 0;
        shp = 3;
        flash = 0;
        hop = 0.3f;
        dead = 0;
        sface = fromLeft ? 1 : -1;
        scolor = COLORS[rnd.nextInt(COLORS.length)];
    }

    /** 앱에서 임무를 끝냈을 때: 머리 위로 경험치·골드, 장비가 나오면 등급색 반짝임 */
    void reward(int xp, int gold, String rarity) {
        // 화면 위 용사는 띠가 낮아서 글자를 조금 아래에서 시작
        float base = overlay ? 22 : 30;
        float lift = 0;
        if (xp > 0) { addText("+" + xp + " EXP", hx, base + lift, Color.parseColor("#7fe3ff"), 1); lift += 7; }
        if (gold > 0) { addText("+" + gold + "G", hx, base + lift, Color.parseColor("#ffd447"), 1); lift += 7; }
        if (rarity != null && !rarity.isEmpty() && !"null".equals(rarity)) {
            int col = rarityColor(rarity);
            addText("legendary".equals(rarity) ? "LEGENDARY!" : "epic".equals(rarity) ? "EPIC!" : "ITEM!", hx, base + lift, col, 2);
            for (int i = 0; i < 18; i++) {
                Part p = new Part();
                p.x = hx + (rnd.nextFloat() - 0.5f) * 20;
                p.y = 4 + rnd.nextFloat() * 10;
                p.vx = (rnd.nextFloat() - 0.5f) * 40;
                p.vy = 80 + rnd.nextFloat() * 80;
                p.color = col;
                parts.add(p);
            }
        }
        if (hy == 0) hvy = 120;
    }

    private void addText(String s, float x, float y, int color, int size) {
        Text t = new Text();
        t.x = x;
        t.y = y;
        t.s = s;
        t.color = color;
        t.size = size;
        texts.add(t);
    }

    private static int rarityColor(String r) {
        switch (r) {
            case "rare": return Color.parseColor("#4aa8ff");
            case "epic": return Color.parseColor("#c07bff");
            case "legendary": return Color.parseColor("#ffb52e");
            default: return Color.parseColor("#d6dae2");
        }
    }

    void tap(float px, float py) {
        float x = px / S;
        float y = py / S;
        if (dead == 0 && Math.abs(x - sx) < 12 && Math.abs(y - (ground - 6 - sy)) < 14) {
            strike(true);
        } else if (Math.abs(x - hx) < 12 && Math.abs(y - (ground - 12 - hy)) < 16 && hy == 0) {
            hvy = 150;
        } else {
            hface = x >= hx ? 1 : -1;
        }
    }

    void step(float dt) {
        time += dt;
        anim += dt;
        ht += dt;
        cooldown -= dt;
        // 용사 점프
        hvy -= GRAVITY * dt;
        hy += hvy * dt;
        if (hy <= 0) { hy = 0; hvy = 0; }
        // 슬라임
        if (dead > 0) {
            dead += dt;
            if (dead > 1.0f) spawn();
        } else {
            svy -= GRAVITY * dt;
            sy += svy * dt;
            sx += svx * dt;
            if (sy <= 0) { sy = 0; svy = 0; svx *= 0.85f; }
            hop -= dt;
            flash -= dt;
            if (hop <= 0 && sy == 0) {
                int dir = hx >= sx ? 1 : -1;
                sface = dir;
                svx = dir * 32;
                svy = 105;
                hop = 0.9f + rnd.nextFloat() * 0.6f;
            }
        }
        if (attacking) {
            if (!hit && ht > 0.12f) { hit = true; strike(false); }
            if (ht > 0.36f) { attacking = false; ht = 0; }
        } else if (dead == 0) {
            float dx = sx - hx;
            hface = dx >= 0 ? 1 : -1;
            if (Math.abs(dx) < 16) {
                if (cooldown <= 0 && hy == 0) { attacking = true; ht = 0; hit = false; cooldown = 0.8f; }
            } else {
                hx += hface * 26 * dt;
            }
        }
        hx = clamp(hx, 10, W - 10);
        for (Iterator<Text> it = texts.iterator(); it.hasNext(); ) {
            Text t = it.next();
            t.t += dt;
            t.y += (overlay ? 9 : 16) * dt;
            if (t.t > (t.s.length() > 4 ? 1.6f : 0.9f)) it.remove();
        }
        for (Iterator<Part> it = parts.iterator(); it.hasNext(); ) {
            Part p = it.next();
            p.t += dt;
            p.vy -= 360 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.t > 0.6f) it.remove();
        }
    }

    private void strike(boolean byTap) {
        if (dead > 0) return;
        shp -= 1;
        flash = 0.12f;
        svx = (sx >= hx ? 1 : -1) * 70;
        svy = 90;
        boolean crit = rnd.nextFloat() < (byTap ? 0.4f : 0.2f);
        int dmg = crit ? 14 + rnd.nextInt(7) + level : 6 + rnd.nextInt(6) + level / 2;
        Text t = new Text();
        t.x = sx;
        t.y = 16;
        t.s = crit ? dmg + "!" : String.valueOf(dmg);
        t.color = crit ? Color.parseColor("#ffd447") : Color.WHITE;
        t.size = crit ? 2 : 1;
        texts.add(t);
        if (shp <= 0) {
            dead = 0.0001f;
            int col = slimeColor();
            for (int i = 0; i < 12; i++) {
                Part p = new Part();
                p.x = sx;
                p.y = 5;
                p.vx = -60 + rnd.nextFloat() * 120;
                p.vy = 60 + rnd.nextFloat() * 80;
                p.color = col;
                parts.add(p);
            }
            Text g = new Text();
            g.x = sx;
            g.y = 22;
            g.s = "+1G";
            g.color = Color.parseColor("#ffd447");
            g.size = 1;
            texts.add(g);
        }
    }

    private int slimeColor() {
        try {
            return PixelArt.color(PixelArt.data(ctx).getJSONObject("slime").getJSONObject("colors").getJSONObject(scolor).optString("g"));
        } catch (Exception e) {
            return Color.GREEN;
        }
    }

    void draw(Canvas c) {
        if (overlay) {
            c.drawColor(Color.TRANSPARENT, android.graphics.PorterDuff.Mode.CLEAR);
        } else {
            if (bg == null || bg.getWidth() != width || bg.getHeight() != height) bg = buildBackground();
            c.drawBitmap(bg, 0, 0, null);
        }
        // 반짝이는 별 (배경화면만)
        for (int i = 0; !overlay && i < starX.length; i += 3) {
            float a = (float) (0.5 + 0.5 * Math.sin(time * 2.2 + i));
            paint.setColor(i % 2 == 0 ? Color.WHITE : Color.parseColor("#7fe3ff"));
            paint.setAlpha((int) (60 + 195 * a));
            c.drawRect(starX[i] * S, starY[i] * S, starX[i] * S + S, starY[i] * S + S, paint);
        }
        paint.setAlpha(255);
        // 그림자 (배경화면만)
        if (!overlay) {
            paint.setColor(Color.argb(70, 0, 0, 0));
            c.drawRect((hx - 5) * S, ground * S - S, (hx + 5) * S, ground * S, paint);
            if (dead == 0) c.drawRect((sx - 6) * S, ground * S - S, (sx + 6) * S, ground * S, paint);
        }
        // 슬라임
        if (dead == 0) {
            String frame = flash > 0 ? "hurt" : sy > 0 ? "stretch" : "idle";
            Bitmap b = PixelArt.slime(ctx, frame, scolor, S, sface < 0);
            c.drawBitmap(b, Math.round(sx - 9) * S, Math.round(ground - 12 - sy) * S, paint);
        }
        // 용사
        String pose;
        if (attacking) pose = ht < 0.12f ? "atk0" : ht < 0.24f ? "atk1" : "atk2";
        else if (dead > 0 && hy == 0) pose = ((int) (anim * 1.6f)) % 2 == 0 ? "idle0" : "idle1";
        else pose = ((int) (anim * 8)) % 2 == 0 ? "walk0" : "walk1";
        Bitmap hb = PixelArt.hero(ctx, pose, gear, S, hface < 0);
        int footX = hface < 0 ? 15 : 16;
        c.drawBitmap(hb, Math.round(hx - footX) * S, Math.round(ground - 24 - hy) * S, paint);
        PixelArt.drawText(ctx, c, "LV" + level, hx * S, (ground - 27 - hy) * S, Color.parseColor("#7fe3ff"), Math.max(2, S / 2), 230);
        // 파티클·숫자
        for (Part p : parts) {
            paint.setColor(p.color);
            paint.setAlpha((int) (255 * Math.max(0, 1 - p.t / 0.6f)));
            c.drawRect(Math.round(p.x) * S, (ground - 1 - Math.round(p.y)) * S, Math.round(p.x) * S + S, (ground - Math.round(p.y)) * S, paint);
        }
        paint.setAlpha(255);
        for (Text t : texts) {
            float life = t.s.length() > 4 ? 1.6f : 0.9f;
            int alpha = (int) (255 * Math.max(0, 1 - t.t / life));
            PixelArt.drawText(ctx, c, t.s, t.x * S, (ground - 8 - t.y) * S, t.color, Math.max(2, S / 2) * t.size, alpha);
        }
    }

    /** 밤하늘·산·땅 (한 번 그려 두고 재사용) */
    private Bitmap buildBackground() {
        Bitmap b = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        Paint p = new Paint();
        p.setAntiAlias(false);
        int[] sky = {Color.parseColor("#0f0d1f"), Color.parseColor("#1e1940"), Color.parseColor("#3d2a5c"), Color.parseColor("#7a4a6e")};
        int g = (int) ground;
        for (int y = 0; y < g; y++) {
            float f = y / (float) Math.max(1, g);
            int idx = Math.min(2, (int) (f * 3));
            float local = f * 3 - idx;
            // 도트 느낌: 띠 모양으로 끊어서 섞는다
            local = Math.round(local * 6) / 6f;
            p.setColor(mix(sky[idx], sky[idx + 1], local));
            c.drawRect(0, y * S, width, (y + 1) * S, p);
        }
        // 먼 산
        Random r = new Random(11);
        int far = Color.parseColor("#2a2142");
        int near = Color.parseColor("#1c1630");
        float hFar = 0;
        float hNear = 0;
        for (int x = 0; x < W; x++) {
            hFar = clamp(hFar + (r.nextFloat() - 0.48f) * 2.2f, 4, 22);
            hNear = clamp(hNear + (r.nextFloat() - 0.5f) * 2.6f, 2, 12);
            p.setColor(far);
            c.drawRect(x * S, (g - Math.round(hFar)) * S, (x + 1) * S, g * S, p);
            p.setColor(near);
            c.drawRect(x * S, (g - Math.round(hNear)) * S, (x + 1) * S, g * S, p);
        }
        // 땅
        int grass = Color.parseColor("#3f9b55");
        int grassDark = Color.parseColor("#2b6d3b");
        int dirt = Color.parseColor("#3b281c");
        int speck = Color.parseColor("#523826");
        p.setColor(dirt);
        c.drawRect(0, g * S, width, height, p);
        p.setColor(grass);
        c.drawRect(0, g * S, width, (g + 1) * S, p);
        p.setColor(grassDark);
        c.drawRect(0, (g + 1) * S, width, (g + 2) * S, p);
        p.setColor(speck);
        for (int i = 0; i < W * 2; i++) {
            int x = r.nextInt(Math.max(1, W));
            int y = g + 3 + r.nextInt(Math.max(1, H - g - 3));
            c.drawRect(x * S, y * S, (x + 1) * S, (y + 1) * S, p);
        }
        // 정적인 별 (반짝이는 별과 별개로 흐린 별)
        p.setColor(Color.argb(110, 255, 255, 255));
        for (int i = 1; i < starX.length; i += 3) c.drawRect(starX[i] * S, starY[i] * S, starX[i] * S + S, starY[i] * S + S, p);
        return b;
    }

    private static int mix(int a, int b, float t) {
        return Color.rgb(
                (int) (Color.red(a) + (Color.red(b) - Color.red(a)) * t),
                (int) (Color.green(a) + (Color.green(b) - Color.green(a)) * t),
                (int) (Color.blue(a) + (Color.blue(b) - Color.blue(a)) * t));
    }

    private static float clamp(float v, float a, float b) {
        return Math.max(a, Math.min(b, v));
    }
}
