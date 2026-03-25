import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Calendar, Users, Linkedin } from 'lucide-react'

export const metadata = {
  title: 'About | NDLI Club',
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl animate-in fade-in">
      <div className="flex flex-col items-center text-center space-y-6 mb-12">
        <div className="w-40 h-40 flex items-center justify-center mb-2">
          <img src="/ndli-logo-nbg.png" alt="NDLI Club Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">About NDLI Club</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          National Digital Library of India (NDLI) Club at Sri Sairam Engineering College
        </p>
      </div>

      <div className="space-y-8">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-6 h-6 text-primary" />
              Who We Are
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed text-lg">
            The NDLI Club of our college is an integral part of our vibrant academic community, fostering a culture of reading, learning, and intellectual exploration. Supported by a team of active volunteers and guiding staff, the club is dedicated to promoting the effective use of resources among students and faculty.
            <br/><br/>
            Housed within the spacious and fully equipped college library, the NDLI Club conducts innovative and inspiring events aimed at involving students with books and digital resources. From creative activities to engaging discussions, every event is designed to ignite a passion for learning and provide valuable takeaways for participants.
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="w-6 h-6 text-emerald-500" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              To establish the NDLI Club as a vibrant hub of learning and engagement, fostering a passion for books, knowledge, and creativity. By leveraging the resources of the National Digital Library and organizing impactful activities, we aim to develop well-rounded individuals who contribute meaningfully to society.
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-6 h-6 text-blue-500" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              To create a vibrant and engaging platform where students can explore, connect, and grow through the world of books and knowledge. With active volunteers and dedicated guiding staff, we aim to organize innovative events, interactive book fairs, and creative library initiatives that inspire curiosity, foster critical thinking, and build a culture of lifelong learning and collaboration.
            </CardContent>
          </Card>
        </div>
        
        {/* Developer & Contact */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
              Developer &amp; Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed">
            <p>
              This Management Information System was designed and developed by{' '}
              <strong>Yogeshwaran Kumar</strong>{' '}(SEC23CB014), a dedicated member of the NDLI Club.
            </p>
            <p className="mt-4">
              For professional inquiries, collaboration opportunities, or adapting this system for your club, please connect via{' '}
              <a
                href="https://linkedin.com/in/yogeshwaran2005"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0A66C2] hover:underline font-semibold"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-10 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NDLI Club MIS. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
