import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

export async function getSession() {
    const session = await getServerSession(authOptions);
    console.log('[getSession] Session status:', session ? `Authenticated as ${session.user?.email}` : 'No session found');
    return session;
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}

export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        console.warn('[requireAuth] No session found, throwing Unauthorized');
        throw new Error('Unauthorized');
    }
    console.log('[requireAuth] User ID:', session.user.id);
    return session.user;
}
