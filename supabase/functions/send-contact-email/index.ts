
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  facilityName: string;
  contactName: string;
  email: string;
  phone: string;
  facilityType: string;
  facilitySize: string;
  location: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();
    console.log("Received form data:", formData);

    // Skip saving to database and directly send email
    const { data, error } = await resend.emails.send({
      from: "SynchoraHealth <onboarding@resend.dev>",
      to: ["info.remindcare@gmail.com"],
      subject: `New Facility Interest: ${formData.facilityName}`,
      html: `
        <h1>New Interest in SynchoraHealth</h1>
        <h2>Facility Information</h2>
        <p><strong>Facility Name:</strong> ${formData.facilityName}</p>
        <p><strong>Contact Person:</strong> ${formData.contactName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone}</p>
        <p><strong>Facility Type:</strong> ${formData.facilityType}</p>
        <p><strong>Facility Size:</strong> ${formData.facilitySize}</p>
        <p><strong>Location:</strong> ${formData.location}</p>
        ${formData.message ? `<p><strong>Additional Message:</strong> ${formData.message}</p>` : ''}
        <hr />
        <p>This inquiry was submitted via the SynchoraHealth contact form.</p>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(error.message);
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
