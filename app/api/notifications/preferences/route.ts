import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notifications/types';

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    let preference = await prisma.notificationPreference.findUnique({
      where: { userId: user.userId },
    });

    // Create default preferences if they don't exist
    if (!preference) {
      preference = await prisma.notificationPreference.create({
        data: {
          userId: user.userId,
          emailEnabled: true,
          inappEnabled: true,
          preferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
        },
      });
    }

    return NextResponse.json({ data: preference });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update user's notification preferences
 */
const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inappEnabled: z.boolean().optional(),
  preferences: z
    .record(
      z.object({
        email: z.boolean(),
        inapp: z.boolean(),
      })
    )
    .optional(),
});

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();

    // Validate request body
    const validation = updatePreferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { emailEnabled, inappEnabled, preferences } = validation.data;

    // Check if preferences exist
    let preference = await prisma.notificationPreference.findUnique({
      where: { userId: user.userId },
    });

    if (!preference) {
      // Create with default preferences
      preference = await prisma.notificationPreference.create({
        data: {
          userId: user.userId,
          emailEnabled: emailEnabled ?? true,
          inappEnabled: inappEnabled ?? true,
          preferences: (preferences ?? DEFAULT_NOTIFICATION_PREFERENCES) as any,
        },
      });
    } else {
      // Update existing preferences
      const updateData: any = {};

      if (emailEnabled !== undefined) {
        updateData.emailEnabled = emailEnabled;
      }

      if (inappEnabled !== undefined) {
        updateData.inappEnabled = inappEnabled;
      }

      if (preferences !== undefined) {
        // Merge with existing preferences
        const existingPrefs =
          (preference.preferences as Record<string, any>) || {};
        updateData.preferences = {
          ...existingPrefs,
          ...preferences,
        };
      }

      preference = await prisma.notificationPreference.update({
        where: { userId: user.userId },
        data: updateData,
      });
    }

    return NextResponse.json({
      data: preference,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}