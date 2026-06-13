/**
 * data/members.js
 * RCCG Media Department – Member roster (sourced from 2026 schedule)
 *
 * roles:    presenter, videoMixer, sound, light, camera, mobileCamera,
 *           recordedProduction, print, socialMedia
 * statuses: mediaCoordinator, soundCoordinator, hod, ahod, nonParticipant, probation
 *
 * Role rules enforced by the scheduler:
 *   - Only members with "mobileCamera" in roles[] are assigned Mobile Camera.
 *     If exactly ONE person has it, they serve every week (sticky).
 *     If no one has it, the scheduler falls back to general camera-trained members.
 *   - Camera 1 (A/B), Camera 2 (A/B), Picture → must have "camera" in roles[]
 *   - Sound (A/B)  → must have "sound" in roles[]
 *   - Video Mixer  → must have "videoMixer" in roles[]
 *   - Light        → must have "light" in roles[]
 *   - Media Coordinator slot → must have "mediaCoordinator" in statuses[]
 *   - Sound Coordinator slot → must have "soundCoordinator" in statuses[]
 *   - HOD, AHOD, nonParticipant, probation in statuses[] → excluded from all scheduling
 */

const MEMBERS = [
  { id: 1,  name: "Adebola Ogundipe",          phone: "317.603.9938", dob: "Apr-4",   roles: ["presenter"],                                        servicePreference: "1st",  highlight: false, statuses: [] },
  { id: 2,  name: "Ademola Aina",               phone: "240-544-8556", dob: "23-Mar",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 3,  name: "Adura Adenike",              phone: "765.631.1408", dob: "10-Apr",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 4,  name: "Akin Akinpelu",              phone: "317.441.2032", dob: "1-Mar",   roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 5,  name: "Akinsola Jegede",            phone: "317.730.1911", dob: "19-Jun",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 6,  name: "Alex Agunbiade",             phone: "765.440.6970", dob: "14-Apr",  roles: ["presenter","sound"],                                servicePreference: "",     highlight: false, statuses: [] },
  { id: 7,  name: "AlDrea Holland",             phone: "917.252.4524", dob: "20-Jan",  roles: ["presenter","sound"],                                servicePreference: "",     highlight: false, statuses: [] },
  { id: 8,  name: "Ayodeji Babaleye",           phone: "317.652.2392", dob: "15-Nov",  roles: ["sound"],                                            servicePreference: "",     highlight: false, statuses: [] },
  { id: 9,  name: "Ayotunde Adetoye",           phone: "214.213.1301", dob: "3-Jun",   roles: ["presenter"],                                        servicePreference: "",     highlight: true,  statuses: [] },
  { id: 10, name: "Ayomide Ojo",                phone: "929.413.1976", dob: "23-Mar",  roles: ["presenter","light"],                                servicePreference: "",     highlight: false, statuses: [] },
  { id: 11, name: "Ayowunmi Adetoye",           phone: "214.853.2013", dob: "14-May",  roles: ["presenter","light"],                                servicePreference: "",     highlight: false, statuses: [] },
  { id: 12, name: "Ben Ahanmisi",               phone: "317.531.5120", dob: "",        roles: ["sound"],                                            servicePreference: "",     highlight: false, statuses: [] },
  { id: 13, name: "Chichi Eze",                 phone: "765.476.3538", dob: "6-Sep",   roles: ["videoMixer"],                                       servicePreference: "",     highlight: false, statuses: [] },
  { id: 14, name: "Daniel Akinmiranya",         phone: "317.631.0215", dob: "15-Aug",  roles: ["sound"],                                            servicePreference: "",     highlight: false, statuses: [] },
  { id: 15, name: "David Eguniyomi",            phone: "317-801-3051", dob: "22-Apr",  roles: ["camera"],                                           servicePreference: "",     highlight: true,  statuses: [] },
  { id: 16, name: "Dorcas Olayiwola",           phone: "317.966.9056", dob: "27-Jun",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 17, name: "Favour Ogundipe",            phone: "317.665.1799", dob: "22-May",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 18, name: "Femi Ajakaiye",              phone: "312.522.3438", dob: "27-Mar",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 19, name: "Femi Eleshin",               phone: "317.440.6618", dob: "",        roles: ["socialMedia"],                                      servicePreference: "",     highlight: false, statuses: [] },
  { id: 20, name: "Femi Oyetola",               phone: "317.702.3100", dob: "29-Apr",  roles: ["presenter","camera"],                               servicePreference: "",     highlight: false, statuses: [] },
  { id: 21, name: "Fewa Martins",               phone: "404.953.2491", dob: "4-Oct",   roles: ["presenter","camera"],                               servicePreference: "",     highlight: false, statuses: [] },
  { id: 22, name: "Folakemi Oyawale",           phone: "317.386.7886", dob: "12-Jul",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 23, name: "Funsho Aramide",             phone: "317.353.5120", dob: "20-Dec",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 24, name: "Ifedoruwa Orimolado",        phone: "480.440.1249", dob: "25-May",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 25, name: "Imodiuwa Oluwatope",         phone: "317.457.4610", dob: "25-May",  roles: ["presenter","camera"],                               servicePreference: "",     highlight: false, statuses: [] },
  { id: 26, name: "John Agiri",                 phone: "317.968.8617", dob: "31-Aug",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 27, name: "Kehinde Omotosho",           phone: "317.869.2319", dob: "18-Oct",  roles: ["presenter","videoMixer","camera"],                  servicePreference: "",     highlight: true,  statuses: [] },
  { id: 28, name: "Kunle Akinmboni",            phone: "317.603.1247", dob: "28-Sep",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 29, name: "Monilade Afolabi",           phone: "317.547.7191", dob: "16-Apr",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 30, name: "Michael Kunle",              phone: "317.603.5723", dob: "24-Nov",  roles: ["sound"],                                            servicePreference: "",     highlight: false, statuses: [] },
  { id: 31, name: "Olanrewaju Olawore",         phone: "317.515.9643", dob: "15-Jan",  roles: ["sound"],                                            servicePreference: "",     highlight: false, statuses: [] },
  { id: 32, name: "Olabimpe Bello",             phone: "765.891.3818", dob: "10-Oct",  roles: ["presenter","videoMixer","camera"],                  servicePreference: "",     highlight: false, statuses: [] },
  { id: 33, name: "Opeyemi Asaolu",             phone: "971.234.3970", dob: "8-Jul",   roles: ["presenter","videoMixer","camera"],                  servicePreference: "",     highlight: false, statuses: [] },
  { id: 34, name: "Osuaremen Imafdon",          phone: "332.911.3343", dob: "14-Mar",  roles: ["videoMixer"],                                       servicePreference: "",     highlight: false, statuses: [] },
  { id: 35, name: "Sayi Odewade",               phone: "973.704.0024", dob: "4-Aug",   roles: ["presenter","videoMixer"],                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 36, name: "Sunday Omotosho",            phone: "317.450.8395", dob: "1-Jun",   roles: ["sound","light"],                                    servicePreference: "",     highlight: false, statuses: [] },
  { id: 37, name: "Taiwo Omotosho",             phone: "317.998.7587", dob: "18-Oct",  roles: ["presenter","videoMixer","camera"],                  servicePreference: "",     highlight: true,  statuses: [] },
  { id: 38, name: "Tayo Akinmboni",             phone: "317.518.4056", dob: "13-Apr",  roles: ["presenter","camera"],                               servicePreference: "",     highlight: true,  statuses: [] },
  { id: 39, name: "Fewa Martins",               phone: "317.603.8235", dob: "",        roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 40, name: "Tobi Adekunran",             phone: "267.436.2257", dob: "10-Apr",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 41, name: "Funmi/Ayodemi Adeosun",      phone: "317.503.1921", dob: "18-Apr",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 42, name: "Michael Adaniji",            phone: "859.285.9498", dob: "",        roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 43, name: "Zainab Lawal",               phone: "317.858.9079", dob: "12-Jul",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 44, name: "Micheal Akinbobola",         phone: "",             dob: "9-Jul",   roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 45, name: "Kevin Odauo",                phone: "317.999.1631", dob: "5-May",   roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 46, name: "Akinlola Fagbite",           phone: "317.515.4522", dob: "25-Sep",  roles: ["camera"],                                           servicePreference: "",     highlight: false, statuses: [] },
  { id: 47, name: "Anjola Fajobi",              phone: "404.452.0300", dob: "",        roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
  { id: 48, name: "Feranmi Oladunjoye",         phone: "317.417.4210", dob: "15-Dec",  roles: ["presenter"],                                        servicePreference: "",     highlight: false, statuses: [] },
];

const ROLES = [
  { key: "presenter",          label: "Pro / Presenter",        color: "#6366f1" },
  { key: "videoMixer",         label: "Video Mixer",            color: "#0ea5e9" },
  { key: "sound",              label: "Sound",                  color: "#10b981" },
  { key: "light",              label: "Light",                  color: "#f59e0b" },
  { key: "camera",             label: "Pic/Video Camera",       color: "#ef4444" },
  { key: "mobileCamera",       label: "Mobile Camera",          color: "#ec4899" },
  { key: "recordedProduction", label: "Recorded Production",    color: "#8b5cf6" },
  { key: "print",              label: "Print",                  color: "#ec4899" },
  { key: "socialMedia",        label: "Social Media",           color: "#14b8a6" },
];

// STATUSES — control scheduling eligibility
// Set these in the member entry above to affect the scheduler:
// "mediaCoordinator" → assigned Media Coordinator slot only
// "soundCoordinator" → assigned Sound Coordinator slot only
// "hod"              → excluded from all scheduling (Head of Dept)
// "ahod"             → excluded from all scheduling (Asst. Head of Dept)
// "nonParticipant"   → excluded from all scheduling
// "probation"        → excluded from all scheduling
const MEMBER_STATUSES = ["mediaCoordinator","soundCoordinator","hod","ahod","nonParticipant","probation"];

// 2026 Sunday service dates
const SUNDAYS_2026 = (() => {
  const sundays = [];
  const d = new Date(2026, 0, 4); // first Sunday of 2026
  while (d.getFullYear() === 2026) {
    sundays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
})();

function getSundaysForQuarter(year, quarter) {
  const starts = [[0,2],[3,5],[6,8],[9,11]];
  const [sm, em] = starts[quarter - 1];
  const all = [];
  const d = new Date(year, 0, 1);
  // find first Sunday
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    if (d.getMonth() >= sm && d.getMonth() <= em) all.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return all;
}

if (typeof module !== "undefined") module.exports = { MEMBERS, ROLES, getSundaysForQuarter };
