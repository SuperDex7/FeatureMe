import React from 'react';
import '../Styling/PrivacyPage.css';
import Header2 from "../Components/Header2";

function PrivacyPage() {
  return (
    <div className="privacy-page">
      <Header2 />
      <div className="privacy-container">
        <div className="privacy-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to FeatureMe ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide to Us</h3>
            <ul>
              <li><strong>Account Information:</strong> When you create an account, we collect your username, email address, and password (which is encrypted and securely stored).</li>
              <li><strong>Profile Information:</strong> You may choose to provide additional information such as profile pictures, banner images, bio, about section, location (optional), and social media links (optional).</li>
              <li><strong>Content:</strong> We collect content you post, including music files, audio files, images, descriptions, titles, genres, features, pricing information, and comments you make on posts.</li>
              <li><strong>Payment Information:</strong> If you subscribe to our premium services, we collect payment information through Stripe. We store your Stripe customer ID and subscription status, but we do not store your credit card details (handled securely by Stripe).</li>
              <li><strong>Communication:</strong> We collect information you provide when you communicate with other users through our messaging features.</li>
            </ul>

            <h3>2.2 Information We Collect Automatically</h3>
            <ul>
              <li><strong>Engagement Data:</strong> We track when you view, like, download, or comment on posts. This includes storing your username, the post ID, timestamps of first and last view, and view counts.</li>
              <li><strong>Account Activity:</strong> We store lists of posts you've created, posts you've liked, chats you're part of, badges you've earned, and demos you've uploaded.</li>
              <li><strong>Account Metadata:</strong> We automatically record when your account was created.</li>
              <li><strong>Authentication:</strong> We use cookies to store your authentication token (JWT) to keep you logged in.</li>
            </ul>

            <h3>2.3 Information We Do NOT Collect</h3>
            <ul>
              <li>We do not use third-party analytics services (such as Google Analytics).</li>
              <li>We do not collect device identifiers, browser fingerprinting, or detailed device information.</li>
              <li>We do not track your activity across other websites.</li>
              <li>We do not collect location data from your device (only the location you optionally provide in your profile).</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including:</p>
            <ul>
              <li>To provide, maintain, and improve our services</li>
              <li>To create and manage your account</li>
              <li>To process transactions and send related information</li>
              <li>To communicate with you about your account, our services, and updates</li>
              <li>To track post views, likes, downloads, and comments for analytics purposes (available to post creators with premium subscriptions)</li>
              <li>To provide personalized features such as showing posts you've liked and users you follow</li>
              <li>To detect, prevent, and address technical issues and security threats</li>
              <li>To enforce our Terms of Service and protect our rights</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Public Profile Information:</strong> Your username, profile picture, banner, bio, and public posts are visible to other users on our platform.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf:
                <ul>
                  <li><strong>Stripe:</strong> For payment processing and subscription management. Stripe processes your payment information securely and does not share your full payment details with us.</li>
                  <li><strong>MongoDB:</strong> Our database hosting provider where your data is stored.</li>
                  <li><strong>Email Service:</strong> For sending verification emails and account-related communications.</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, property, or safety, or that of others.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
              <li><strong>With Your Consent:</strong> We may share your information with your explicit consent or at your direction.</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>6. Your Rights and Choices</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul>
              <li><strong>Access:</strong> You can access and update your account information through your profile settings.</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us.</li>
              <li><strong>Correction:</strong> You can update or correct your personal information at any time through your account settings.</li>
              <li><strong>Opt-Out:</strong> You can opt out of certain communications by adjusting your notification preferences or unsubscribing from marketing emails.</li>
              <li><strong>Data Portability:</strong> You may request a copy of your data in a portable format.</li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies and Local Storage</h2>
            <p>
              We use the following storage technologies:
            </p>
            <ul>
              <li><strong>Cookies:</strong> We use cookies to store your authentication token (JWT) to keep you logged in. This cookie is essential for the platform to function. You can delete cookies through your browser settings, but this will log you out of the platform.</li>
              <li><strong>Local Storage:</strong> We use browser local storage to temporarily store view tracking cooldown timestamps. This prevents spam viewing and helps us provide accurate view counts. This data is stored locally on your device and is not transmitted to our servers.</li>
            </ul>
            <p>
              We do not use third-party tracking cookies or advertising cookies. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you will not be able to stay logged in to our platform.
            </p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Links</h2>
            <p>
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our services, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> therealfeatureme@gmail.com<br />
              <strong>Website:</strong> <a href="https://featureme.co">https://featureme.co</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;

