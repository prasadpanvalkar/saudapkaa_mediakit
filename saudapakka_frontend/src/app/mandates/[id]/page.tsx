import { redirect } from 'next/navigation';


// Force dynamic rendering if needed, though usually automatic
export const dynamic = 'force-dynamic';

export default async function MandateRedirectPage(props: { params: Promise<{ id: string }> }) {
    // Await the params promise explicitly
    const params = await props.params;

    if (!params?.id) {
        console.error("MandateRedirectPage: No ID found in params");
        redirect('/dashboard/mandates');
    }

    // Redirect to the dashboard view
    redirect(`/dashboard/mandates/${params.id}`);
}
