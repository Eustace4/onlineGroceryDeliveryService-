<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomResetPassword extends Notification
{
    public $token;
    public $email;

    public function __construct($token, $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $url = "http://localhost:3000/reset-password/{$this->token}?email=" . urlencode($this->email);


        return (new MailMessage)
            ->subject('Reset Your Password')
            ->line('Click the button below to reset your password.')
            ->action('Reset Password', $url)
            ->line('If you didn’t request this, no further action is required.');
    }
}