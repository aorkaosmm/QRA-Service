package com.calendarrpg.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;

import org.json.JSONObject;

/**
 * 홈 화면 위젯용 전투 반복 장면 (12장, 위젯 ViewFlipper 가 한 장씩 넘긴다).
 * 용사가 슬라임을 두 번 베고(두 번째는 치명타) 슬라임이 터지면 새 슬라임이 통통 들어온다.
 */
final class BattleLoop {
    static final int FRAMES = 12;
    static final int W = 56;
    static final int H = 32;
    private static final int GROUND = H - 2; // 발이 닿는 줄 (맨 아래 줄은 땅 선)

    private static final String[] HERO = {"idle0", "idle1", "atk0", "atk1", "atk2", "idle0", "idle1", "atk0", "atk1", "atk2", "idle0", "idle1"};
    private static final int[] HERO_DX = {0, 0, -1, 1, 1, 0, 0, -1, 1, 1, 0, 0};
    private static final String[] SLIME = {"idle", "squash", "idle", "hurt", "stretch", "idle", "squash", "idle", "hurt", "-", "-", "stretch"};
    private static final int[] SLIME_DX = {0, 0, 0, 0, 4, 2, 1, 0, 0, 0, 0, 7};
    private static final int[] SLIME_DY = {0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 5};

    private BattleLoop() {}

    static Bitmap[] frames(Context c, JSONObject gear, int scale, String slimeColor) {
        Bitmap[] out = new Bitmap[FRAMES];
        for (int f = 0; f < FRAMES; f++) out[f] = frame(c, gear, scale, slimeColor, f);
        return out;
    }

    private static Bitmap frame(Context c, JSONObject gear, int s, String color, int f) {
        Bitmap b = Bitmap.createBitmap(W * s, H * s, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(b);
        Paint p = new Paint();
        p.setAntiAlias(false);
        p.setFilterBitmap(false);
        // 땅 선
        p.setColor(Color.argb(70, 255, 255, 255));
        cv.drawRect(0, (H - 1) * s, W * s, H * s, p);

        int slimeX = 40 + SLIME_DX[f];
        if (!"-".equals(SLIME[f])) {
            Bitmap sb = PixelArt.slime(c, SLIME[f], color, s, true);
            cv.drawBitmap(sb, (slimeX - 9) * s, (GROUND - 11 - SLIME_DY[f]) * s, p);
        }
        int heroX = 18 + HERO_DX[f];
        Bitmap hb = PixelArt.hero(c, HERO[f], gear, s, false);
        cv.drawBitmap(hb, (heroX - 16) * s, (GROUND - 23) * s, p);

        int white = Color.WHITE;
        int yellow = Color.parseColor("#ffd447");
        switch (f) {
            case 3: PixelArt.drawText(c, cv, "12", 40 * s, 15 * s, white, s, 255); break;
            case 4: PixelArt.drawText(c, cv, "12", 41 * s, 12 * s, white, s, 220); break;
            case 5: PixelArt.drawText(c, cv, "12", 42 * s, 10 * s, white, s, 120); break;
            case 8: PixelArt.drawText(c, cv, "24!", 40 * s, 14 * s, yellow, 2 * s, 255); break;
            case 9:
                PixelArt.drawText(c, cv, "24!", 40 * s, 11 * s, yellow, 2 * s, 230);
                burst(c, cv, p, color, s, 40, GROUND - 4, 0);
                break;
            case 10:
                PixelArt.drawText(c, cv, "+1G", 40 * s, 12 * s, yellow, s, 255);
                burst(c, cv, p, color, s, 40, GROUND - 2, 1);
                break;
            default: break;
        }
        return b;
    }

    /** 슬라임이 터질 때 조각 (장면이 늘 같도록 고정 위치) */
    private static void burst(Context c, Canvas cv, Paint p, String color, int s, int cx, int cy, int step) {
        int col;
        try {
            col = PixelArt.color(PixelArt.data(c).getJSONObject("slime").getJSONObject("colors").getJSONObject(color).optString("g"));
        } catch (Exception e) {
            col = Color.GREEN;
        }
        p.setColor(col);
        int[][] pts = {{-6, -4}, {-3, -7}, {2, -8}, {6, -5}, {8, -1}, {-8, 0}, {4, -2}, {-1, -3}};
        for (int[] pt : pts) {
            int x = cx + pt[0] * (1 + step);
            int y = cy + pt[1] * (1 + step) / 2 + step * 3;
            cv.drawRect(x * s, y * s, (x + 1) * s, (y + 1) * s, p);
        }
    }
}
