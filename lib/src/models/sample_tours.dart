import 'package:flutter/foundation.dart';

class SampleTour {
  final String id;
  final String title;
  final String description;
  final String location;
  final int stopCount;
  final String duration;
  final String type;
  final List<TourStop> stops;
  bool isDownloaded;

  SampleTour({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.stopCount,
    required this.duration,
    required this.type,
    required this.stops,
    this.isDownloaded = false,
  });
}

class TourStop {
  final String id;
  final String title;
  final String description;
  final double lat;
  final double lng;

  TourStop({
    required this.id,
    required this.title,
    required this.description,
    required this.lat,
    required this.lng,
  });
}

class TourState extends ChangeNotifier {
  static final TourState _instance = TourState._internal();
  factory TourState() => _instance;
  TourState._internal();

  final List<SampleTour> _tours = [
    SampleTour(
      id: 'muttrah-souk',
      title: 'Muttrah Souk',
      description: 'Explore the ancient marketplace of Muttrah, one of the oldest souks in the Arab world. Walk through narrow lanes filled with frankincense, textiles, and traditional Omani crafts.',
      location: 'Muscat, Oman',
      stopCount: 8,
      duration: '1.5 hours',
      type: 'walking',
      stops: [
        TourStop(id: 's1', title: 'Souk Entrance', description: 'The main gateway to the historic market', lat: 23.6195, lng: 58.5676),
        TourStop(id: 's2', title: 'Frankincense Alley', description: 'Famous for traditional Omani incense', lat: 23.6198, lng: 58.5680),
        TourStop(id: 's3', title: 'Textile Quarter', description: 'Colorful fabrics and traditional clothing', lat: 23.6201, lng: 58.5683),
        TourStop(id: 's4', title: 'Spice Market', description: 'Aromatic spices from across the region', lat: 23.6205, lng: 58.5688),
        TourStop(id: 's5', title: 'Silver Crafts', description: 'Traditional Omani jewelry and silverwork', lat: 23.6208, lng: 58.5692),
        TourStop(id: 's6', title: 'Antique Corner', description: 'Vintage items and collectibles', lat: 23.6212, lng: 58.5695),
        TourStop(id: 's7', title: 'Coffee House', description: 'Traditional Omani coffee experience', lat: 23.6215, lng: 58.5699),
        TourStop(id: 's8', title: 'Corniche View', description: 'Beautiful waterfront views', lat: 23.6218, lng: 58.5702),
      ],
    ),
    SampleTour(
      id: 'nizwa-fort',
      title: 'Nizwa Fort & Market',
      description: 'Discover the historic Nizwa Fort and its famous Friday goat market. Learn about Omani heritage and traditional trading practices.',
      location: 'Nizwa, Oman',
      stopCount: 6,
      duration: '2 hours',
      type: 'walking',
      stops: [
        TourStop(id: 'n1', title: 'Fort Entrance', description: 'The imposing entrance to the 17th century fort', lat: 22.9333, lng: 57.5303),
        TourStop(id: 'n2', title: 'Tower Climb', description: 'Ascend the massive circular tower', lat: 22.9335, lng: 57.5305),
        TourStop(id: 'n3', title: 'Date Palm Gardens', description: 'Traditional irrigation systems', lat: 22.9338, lng: 57.5308),
        TourStop(id: 'n4', title: 'Goat Market', description: 'Famous Friday livestock auction', lat: 22.9340, lng: 57.5312),
        TourStop(id: 'n5', title: 'Pottery Souq', description: 'Traditional Omani pottery', lat: 22.9342, lng: 57.5315),
        TourStop(id: 'n6', title: 'Halwa Shop', description: 'Famous Omani sweet delicacy', lat: 22.9345, lng: 57.5318),
      ],
    ),
    SampleTour(
      id: 'wadi-shab',
      title: 'Wadi Shab Adventure',
      description: 'Trek through the stunning Wadi Shab canyon with its crystal-clear pools and hidden waterfalls. An unforgettable nature experience.',
      location: 'Sur, Oman',
      stopCount: 5,
      duration: '3 hours',
      type: 'walking',
      stops: [
        TourStop(id: 'w1', title: 'Boat Crossing', description: 'Cross the river by traditional boat', lat: 22.8411, lng: 59.2358),
        TourStop(id: 'w2', title: 'Palm Oasis', description: 'Lush date palm groves', lat: 22.8420, lng: 59.2365),
        TourStop(id: 'w3', title: 'First Pool', description: 'Crystal clear swimming spot', lat: 22.8428, lng: 59.2372),
        TourStop(id: 'w4', title: 'Cave Entrance', description: 'Swim through to the hidden cave', lat: 22.8435, lng: 59.2380),
        TourStop(id: 'w5', title: 'Hidden Waterfall', description: 'The spectacular hidden waterfall', lat: 22.8442, lng: 59.2388),
      ],
    ),
  ];

  List<SampleTour> get tours => _tours;
  
  List<SampleTour> get downloadedTours => _tours.where((t) => t.isDownloaded).toList();

  void markDownloaded(String tourId) {
    final tour = _tours.firstWhere((t) => t.id == tourId);
    tour.isDownloaded = true;
    notifyListeners();
  }
}

final tourState = TourState();
