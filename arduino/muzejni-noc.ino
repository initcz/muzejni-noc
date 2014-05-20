const int numSensors = 5;
const int numReadings = 10;
const int printFrequency = 10;

int sensors[numSensors] = {
  A0, A1, A2, A3, A4
};
int readings[numSensors][numReadings];
int indices[numSensors];
int total[numSensors];
int average[numSensors];
int printCounter = 0;

void setup() {
  for (int i = 0; i < numSensors; i++) {
    pinMode(sensors[i], INPUT);
    indices[i] = 0;
    total[i] = 0;
    average[i] = 0;
    for (int j = 0; j < numReadings; j++) {
      readings[i][j] = 0;
    }
  }
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo only
  }
}

void loop() {
  printCounter += 1;

  for (int i = 0; i < numSensors; i++) {
    updateDataForSensor(i, analogRead(sensors[i]));
    if (printCounter >= printFrequency) {
      Serial.print(average[i]);
      Serial.print(";");
    }
  }

  if (printCounter >= printFrequency) {
    printCounter = 0;
    Serial.println();
  }

  delay(10);
}

void updateDataForSensor(int sensorIndex, int value) {
  int index = indices[sensorIndex];

  total[sensorIndex] = total[sensorIndex] - readings[sensorIndex][index];
  readings[sensorIndex][index] = value;
  total[sensorIndex] = total[sensorIndex] + readings[sensorIndex][index];
  index += 1;

  average[sensorIndex] = total[sensorIndex] / numReadings;

  if (index >= numReadings) {
    index = 0;
  }
  indices[sensorIndex] = index;
}
