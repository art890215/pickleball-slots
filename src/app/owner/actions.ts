"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { isValidEmail, normalizeInstagram } from "@/lib/venue-links";

export type FormState = { error?: string; notice?: string } | undefined;

function text(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const fullName = text(form, "full_name");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");

  if (!fullName) return { error: "Please enter your name." };
  if (!email) return { error: "Please enter your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/owner`,
    },
  });

  if (error) {
    if (/already registered/i.test(error.message)) {
      return { error: "This email already has an account. Please log in instead." };
    }
    if (/rate limit/i.test(error.message)) {
      return { error: "Too many sign-up emails were sent. Please try again in an hour." };
    }
    return { error: error.message };
  }

  if (data.session) redirect("/owner");
  return { notice: "Almost done! Check your email and tap the confirmation link, then log in." };
}

export async function logIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      return { error: "Please confirm your email first. Check your inbox for the link." };
    }
    if (/invalid login/i.test(error.message)) {
      return { error: "Wrong email or password." };
    }
    return { error: error.message };
  }
  redirect("/owner");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function applyVenue(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/owner/login");

  const fullName = text(form, "full_name");
  const applicantTitle = text(form, "applicant_title");
  const phone = normalizePhone(text(form, "phone"));
  const venueName = text(form, "venue_name");
  const address = text(form, "address");
  const district = text(form, "district");
  const whatsapp = normalizePhone(text(form, "whatsapp"));
  const instagram = normalizeInstagram(text(form, "instagram"));
  const contactEmail = text(form, "contact_email");

  if (!fullName) return { error: "Please enter your name." };
  if (!applicantTitle) return { error: "Please enter your job title, e.g. Owner or Manager." };
  if (!phone) return { error: "Please enter a valid mobile number, e.g. 9123 4567." };
  if (!venueName) return { error: "Please enter the venue name." };
  if (!address) return { error: "Please enter the venue address." };
  if (!district) return { error: "Please choose a district." };
  if (!whatsapp) return { error: "Please enter a valid WhatsApp number for the venue." };
  if (!instagram) return { error: "Please enter the venue's Instagram account, e.g. @tsuenwanpickle." };
  if (!isValidEmail(contactEmail)) return { error: "Please enter a valid email address for the venue." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);
  if (profileError) return { error: `Couldn't save your details: ${profileError.message}` };

  const { error: venueError } = await supabase
    .from("venues")
    .insert({
      name: venueName,
      address,
      district,
      whatsapp,
      instagram,
      contact_email: contactEmail,
      applicant_title: applicantTitle,
    });
  if (venueError) return { error: `Couldn't submit the venue: ${venueError.message}` };

  revalidatePath("/owner");
  redirect("/owner");
}
