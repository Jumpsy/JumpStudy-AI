import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const getOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transcribe with Whisper API
    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text;

    // Check if it's a lecture (contains education keywords)
    const isLecture = checkIfLecture(transcript);

    // If it's a lecture, save to calendar/schedule
    if (isLecture) {
      const scheduleInfo = extractScheduleInfo(transcript);

      if (scheduleInfo) {
        await supabase.from('calendar_events').insert({
          user_id: user.id,
          title: `${scheduleInfo.subject} Lecture`,
          description: transcript,
          event_type: 'class',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        });
      }
    }

    return new Response(
      JSON.stringify({
        transcript,
        isLecture,
        wordCount: transcript.split(/\s+/).length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to transcribe audio' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function checkIfLecture(transcript: string): boolean {
  const lectureKeywords = [
    'today we',
    'chapter',
    'lesson',
    'assignment',
    'homework',
    'exam',
    'quiz',
    'lecture',
    'professor',
    'class',
    'study',
    'learn',
  ];

  const lowerTranscript = transcript.toLowerCase();
  return lectureKeywords.some((keyword) => lowerTranscript.includes(keyword));
}

function extractScheduleInfo(transcript: string): { subject: string } | null {
  const subjects = [
    'math',
    'mathematics',
    'english',
    'science',
    'history',
    'biology',
    'chemistry',
    'physics',
    'literature',
    'geography',
    'economics',
    'psychology',
    'sociology',
  ];

  const lowerTranscript = transcript.toLowerCase();

  for (const subject of subjects) {
    if (lowerTranscript.includes(subject)) {
      return { subject };
    }
  }

  return null;
}
