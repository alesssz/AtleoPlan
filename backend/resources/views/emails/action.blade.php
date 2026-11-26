<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{{-- Dark like the app: clients that honour these leave the colours alone instead of inverting them --}}
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>{{ $title }}</title>
</head>
{{--
  An email with one button (App\Support\ActionEmail). Mail clients drop <style>
  blocks and most layout CSS, hence tables and inline styles only. Each dark
  background is also a one-colour gradient: Gmail's dark mode recolours
  background colours but not images. No web font: Inter would load from the
  app on every open, and the system's sans-serif is close.
--}}
<body style="margin:0; padding:0; background-color:#0b0b0f; background-image:linear-gradient(#0b0b0f,#0b0b0f);">
{{-- The line inboxes show next to the subject --}}
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">{{ $preview }}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b0b0f; background-image:linear-gradient(#0b0b0f,#0b0b0f);">
<tr>
<td align="center" style="padding:40px 16px;">
{{-- Outlook for Windows ignores max-width: a fixed-width table, for it alone, holds the column --}}
<!--[if mso]><table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
{{-- The logo: the mark and the name, "Plan" in lime as in the app --}}
<tr>
<td align="center" style="padding-bottom:28px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<img src="{{ $appUrl }}/email-logo.png" width="56" height="56" alt="" style="display:block; border:0; border-radius:12px;">
<div style="padding-top:12px; font-size:24px; font-weight:800; letter-spacing:-0.5px; color:#ededf2;">Atleo<span style="color:#c6f432;">Plan</span></div>
</td>
</tr>
{{-- The card --}}
<tr>
<td style="background-color:#16161d; background-image:linear-gradient(#16161d,#16161d); border:1px solid #2a2a35; border-radius:24px; padding:36px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<p style="margin:0 0 6px; font-size:12px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#c6f432;">{{ $eyebrow }}</p>
<h1 style="margin:0 0 16px; font-size:24px; line-height:1.25; font-weight:800; letter-spacing:-0.3px; color:#ededf2;">{{ $title }}</h1>
{{-- The address stands out; everything else is escaped as usual --}}
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#c4c4cf;">{!! str_replace(e($email), '<span style="color:#ededf2; white-space:nowrap;">'.e($email).'</span>', e($intro)) !!}</p>
{{-- A button made of a table cell: Outlook ignores padding on links, and margin:auto (hence align) --}}
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
<tr>
<td align="center" style="background-color:#c6f432; border-radius:12px;">
<a href="{{ $url }}" style="display:inline-block; padding:15px 30px; font-size:16px; font-weight:700; color:#0b0b0f; text-decoration:none; border-radius:12px;">{{ $button }}</a>
</td>
</tr>
</table>
<p style="margin:0; font-size:14px; line-height:1.6; color:#8a8a99;">{{ $note }}</p>
</td>
</tr>
{{-- For clients that do not show the button as one --}}
<tr>
<td style="padding:24px 8px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:#6b6b78;">
{{ __('If the button does not work, open this address:') }}<br>
<a href="{{ $url }}" style="color:#8a8a99; word-break:break-all;">{{ $url }}</a>
</td>
</tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</body>
</html>
